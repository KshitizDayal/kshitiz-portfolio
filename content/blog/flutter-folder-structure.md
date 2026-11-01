---
title: "Feature-first Flutter: a folder structure that holds up at 1,000 files"
date: 2026-11-01T22:00:00+05:30
excerpt: Every feature gets its own data, domain and presentation layers, shared code has strict homes, and tests mirror the app. Here's the Flutter structure I use, with the Dart for every layer so you can copy it.
tags: [Flutter, Architecture, Dart]
---

Most Flutter apps I've seen start with `screens/`, `widgets/` and `models/` at the top of `lib/`. That works for ten screens. By fifty, every change means opening five folders, and nobody's sure whether a widget is shared or belongs to one screen.

The StatOz mobile app is now about a thousand Dart files across more than thirty features, and this is the structure I use to keep it manageable. It's **feature-first**: I split the app by what it does, and each feature into three layers.

My stack is the usual one: **BLoC** for state (`flutter_bloc` and `equatable`), **go_router** for navigation and **dio** for networking.

This is the Flutter companion to [my Next.js folder structure](/blog/nextjs-folder-structure). The ideas are the same; the layers are a bit stricter.

## The top level of `lib/`

```text
lib/
├── main.dart        Entry point: initialise SDKs, then runApp
├── app.dart         Root widget: dependencies, app-wide blocs, router
├── session_scoped_blocs.dart   Blocs that hold one user's data
├── theme.dart       Colours, text styles, design tokens
├── core/            Infrastructure: networking, storage, session, sockets
├── routing/         go_router config and route names
├── services/        Third-party SDKs: analytics, ads, deep links
├── shared/          Models, entities and widgets used by several features
├── widgets/         Reusable UI building blocks
├── utils/           Small pure helpers and formatters
└── features/        One folder per feature
```

## Inside a feature: three layers

I give every feature that talks to a backend the same shape:

```text
features/products/
├── data/
│   ├── data_source/      REST calls; returns models
│   ├── models/           JSON ↔ Dart (fromJson / toJson)
│   └── repositories/     Implements the domain repository; turns models into entities
├── domain/
│   ├── entities/         Plain app objects the UI uses
│   ├── repositories/     The abstract repository interface
│   └── use_case/         One class per action
└── presentation/
    ├── bloc/             One folder per bloc: _bloc, _event, _state
    ├── screens/          Full pages, usually one per route
    └── widgets/          Pieces of those pages
```

A request flows down through the layers and the data comes back up:

```text
Screen → Bloc → Use case → Repository (interface) → Repository impl → Data source → ApiClient
                                                     └─ models become entities here
```

The rule that makes it work for me: **`domain/` is pure Dart.** No Flutter imports, no dio, no JSON. Both `data/` and `presentation/` depend on `domain/`, and `domain/` depends on nothing. That's what keeps my business logic easy to test and hard to tangle.

### When a feature needs more

I add these only where they earn their place:

| Folder | Holds |
| --- | --- |
| `domain/engine/` | Complex pure logic (game rules, pricing, simulations) with no Flutter imports, so it can be unit-tested |
| `presentation/utils/` | Mappers from entities to view models, formatters, presenters |
| `presentation/tabs/` | One file per tab of a tabbed screen |
| `data/services/` | Wrappers around platform services, like in-app purchases |

### When a feature needs less

Not everything needs three layers. In my app, a "rate this app" prompt, a walkthrough or a daily reward button is a flat folder with three files in it. **I keep layers for features with data and rules.** Forcing a one-screen feature into nine folders is just ceremony.

## Building one feature, layer by layer

Here's how I build the products feature, from the bottom up.

### Domain: entity, repository and use case

The entity is what the UI works with. I make it `Equatable` for value equality, which BLoC relies on to skip redundant rebuilds:

```dart:lib/features/products/domain/entities/product.dart
import 'package:equatable/equatable.dart';

class Product extends Equatable {
  const Product({required this.id, required this.name, required this.price, required this.inStock});

  final String id;
  final String name;
  final double price;
  final bool inStock;

  @override
  List<Object?> get props => [id, name, price, inStock];
}
```

The repository is just a contract. The domain layer says *what* it needs, not *how* it's fetched:

```dart:lib/features/products/domain/repositories/product_repository.dart
import 'package:shop/features/products/domain/entities/product.dart';

abstract interface class ProductRepository {
  Future<List<Product>> getProducts();
  Future<Product> getProduct(String id);
}
```

I wrap every action in a use case. It looks like overkill for a single call, but it's where rules go when the action grows ("only show products in the user's region", "hide archived items"), and it gives blocs one obvious thing to depend on:

```dart:lib/features/products/domain/use_case/get_products.dart
import 'package:shop/features/products/domain/entities/product.dart';
import 'package:shop/features/products/domain/repositories/product_repository.dart';

class GetProducts {
  const GetProducts(this._repository);

  final ProductRepository _repository;

  Future<List<Product>> call() => _repository.getProducts();
}
```

### Data: model, data source and repository

I keep the model as an exact mirror of the JSON. It's the only class that knows the backend's field names:

```dart:lib/features/products/data/models/product_model.dart
import 'package:shop/features/products/domain/entities/product.dart';

class ProductModel {
  const ProductModel({required this.id, required this.name, required this.price, required this.stock});

  factory ProductModel.fromJson(Map<String, dynamic> json) => ProductModel(
        id: json['id'] as String,
        name: json['name'] as String,
        price: (json['price'] as num).toDouble(),
        stock: json['stock'] as int,
      );

  final String id;
  final String name;
  final double price;
  final int stock;

  Product toEntity() => Product(id: id, name: name, price: price, inStock: stock > 0);
}
```

The data source makes the HTTP calls through the shared client, and nothing else:

```dart:lib/features/products/data/data_source/product_data_source.dart
import 'package:shop/core/api_client.dart';
import 'package:shop/core/api_endpoints.dart';
import 'package:shop/features/products/data/models/product_model.dart';

class ProductDataSource {
  const ProductDataSource(this._client);

  final ApiClient _client;

  Future<List<ProductModel>> fetchProducts() async {
    final data = await _client.get(ApiEndpoints.products) as List<dynamic>;
    return data.map((json) => ProductModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<ProductModel> fetchProduct(String id) async {
    final data = await _client.get(ApiEndpoints.product(id));
    return ProductModel.fromJson(data as Map<String, dynamic>);
  }
}
```

The repository implementation is where I turn models into entities, so nothing above this line ever sees JSON:

```dart:lib/features/products/data/repositories/product_repository_impl.dart
import 'package:shop/features/products/data/data_source/product_data_source.dart';
import 'package:shop/features/products/domain/entities/product.dart';
import 'package:shop/features/products/domain/repositories/product_repository.dart';

class ProductRepositoryImpl implements ProductRepository {
  const ProductRepositoryImpl(this._source);

  final ProductDataSource _source;

  @override
  Future<List<Product>> getProducts() async {
    final models = await _source.fetchProducts();
    return models.map((m) => m.toEntity()).toList();
  }

  @override
  Future<Product> getProduct(String id) async => (await _source.fetchProduct(id)).toEntity();
}
```

### Core: one client for the whole app

Every network call in my app goes through one `ApiClient` in `lib/core/`. It's the only place that knows about auth headers, token refresh, the response envelope and error mapping:

```dart:lib/core/api_client.dart
import 'package:dio/dio.dart';
import 'package:shop/core/api_endpoints.dart';
import 'package:shop/core/api_exception.dart';
import 'package:shop/core/secure_storage.dart';

class ApiClient {
  ApiClient(this._storage) : _dio = Dio(BaseOptions(baseUrl: ApiEndpoints.baseUrl)) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.accessToken();
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
      // Refreshing an expired token on a 401 belongs here too.
    ));
  }

  final Dio _dio;
  final SecureStorage _storage;

  /// Returns the `data` field of the response envelope.
  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(path, queryParameters: query);
      return res.data?['data'];
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}
```

`ApiException` turns dio's errors into a small set of typed errors, each with a `userMessage()` the UI can show. I keep endpoints in one file, so a backend change is a one-line edit:

```dart:lib/core/api_endpoints.dart
abstract final class ApiEndpoints {
  static const baseUrl = String.fromEnvironment('API_URL', defaultValue: 'https://api.example.com');

  static const products = '/products';
  static String product(String id) => '/products/$id';
}
```

### Presentation: bloc, state and screen

I use sealed state classes so the screen handles every case, and the compiler tells me when I've missed one:

```dart:lib/features/products/presentation/bloc/products/products_state.dart
part of 'products_bloc.dart';

sealed class ProductsState extends Equatable {
  const ProductsState();

  @override
  List<Object?> get props => [];
}

final class ProductsLoading extends ProductsState {
  const ProductsLoading();
}

final class ProductsLoaded extends ProductsState {
  const ProductsLoaded(this.products);

  final List<Product> products;

  @override
  List<Object?> get props => [products];
}

final class ProductsFailed extends ProductsState {
  const ProductsFailed(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
}
```

```dart:lib/features/products/presentation/bloc/products/products_event.dart
part of 'products_bloc.dart';

sealed class ProductsEvent {
  const ProductsEvent();
}

final class ProductsRequested extends ProductsEvent {
  const ProductsRequested();
}
```

My blocs only talk to use cases. This one has no idea there's an API behind it:

```dart:lib/features/products/presentation/bloc/products/products_bloc.dart
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shop/core/api_exception.dart';
import 'package:shop/features/products/domain/entities/product.dart';
import 'package:shop/features/products/domain/use_case/get_products.dart';

part 'products_event.dart';
part 'products_state.dart';

class ProductsBloc extends Bloc<ProductsEvent, ProductsState> {
  ProductsBloc(this._getProducts) : super(const ProductsLoading()) {
    on<ProductsRequested>(_onRequested);
  }

  final GetProducts _getProducts;

  Future<void> _onRequested(ProductsRequested event, Emitter<ProductsState> emit) async {
    emit(const ProductsLoading());
    try {
      emit(ProductsLoaded(await _getProducts()));
    } on ApiException catch (e) {
      emit(ProductsFailed(e.userMessage()));
    }
  }
}
```

The screen creates its bloc, starts the load, and switches over the state:

```dart:lib/features/products/presentation/screens/products_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shop/features/products/domain/repositories/product_repository.dart';
import 'package:shop/features/products/domain/use_case/get_products.dart';
import 'package:shop/features/products/presentation/bloc/products/products_bloc.dart';
import 'package:shop/features/products/presentation/widgets/product_grid.dart';
import 'package:shop/widgets/error_view.dart';

class ProductsScreen extends StatelessWidget {
  const ProductsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => ProductsBloc(GetProducts(context.read<ProductRepository>()))
        ..add(const ProductsRequested()),
      child: Scaffold(
        appBar: AppBar(title: const Text('Products')),
        body: BlocBuilder<ProductsBloc, ProductsState>(
          builder: (context, state) => switch (state) {
            ProductsLoading() => const Center(child: CircularProgressIndicator()),
            ProductsFailed(:final message) => ErrorView(message: message),
            ProductsLoaded(:final products) => ProductGrid(products: products),
          },
        ),
      ),
    );
  }
}
```

## Routing in one place

I make every path a constant, and the route table is the only file that knows which screen a path opens:

```dart:lib/routing/routes.dart
abstract final class Routes {
  static const products = '/products';
  static const product = '/products/:id';
  static String productPath(String id) => '/products/$id';
}
```

```dart:lib/routing/app_router.dart
import 'package:go_router/go_router.dart';
import 'package:shop/features/products/presentation/screens/product_screen.dart';
import 'package:shop/features/products/presentation/screens/products_screen.dart';
import 'package:shop/routing/not_found_screen.dart';
import 'package:shop/routing/routes.dart';
import 'package:shop/routing/session_redirect.dart';

final appRouter = GoRouter(
  initialLocation: Routes.products,
  redirect: sessionRedirect,
  errorBuilder: (context, state) => const NotFoundScreen(),
  routes: [
    GoRoute(path: Routes.products, builder: (context, state) => const ProductsScreen()),
    GoRoute(
      path: Routes.product,
      builder: (context, state) => ProductScreen(id: state.pathParameters['id']!),
    ),
  ],
);
```

Two habits pay off for me here:

- **I prefer path parameters over `state.extra`.** A deep link or a restored route only carries the URL. Anything passed through `extra` is gone, so the screen should be able to load itself from an id.
- **I give unknown routes and missing arguments a real screen.** A `NotFoundScreen` is much better than a red error box in production.

My features navigate with `context.go(Routes.productPath(id))`. They import the route constants, never the router itself.

## Wiring it together in `app.dart`

My root widget builds the dependency tree once. Infrastructure first, then repositories that use it:

```dart:lib/app.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shop/core/api_client.dart';
import 'package:shop/core/secure_storage.dart';
import 'package:shop/features/auth/presentation/bloc/auth/auth_bloc.dart';
import 'package:shop/features/products/data/data_source/product_data_source.dart';
import 'package:shop/features/products/data/repositories/product_repository_impl.dart';
import 'package:shop/features/products/domain/repositories/product_repository.dart';
import 'package:shop/routing/app_router.dart';
import 'package:shop/session_scoped_blocs.dart';
import 'package:shop/theme.dart';

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider(create: (_) => SecureStorage()),
        RepositoryProvider(create: (context) => ApiClient(context.read<SecureStorage>())),
        RepositoryProvider<ProductRepository>(
          create: (context) => ProductRepositoryImpl(ProductDataSource(context.read<ApiClient>())),
        ),
      ],
      child: BlocProvider(
        create: (context) => AuthBloc(context.read<SecureStorage>()),
        child: SessionScopedBlocs(
          child: MaterialApp.router(theme: AppTheme.dark, routerConfig: appRouter),
        ),
      ),
    );
  }
}
```

I register the repository as `RepositoryProvider<ProductRepository>` (the interface, not the implementation), which is what lets my tests swap in a fake later.

### Session-scoped blocs: a clean slate on logout

Some state belongs to the app (theme, config, auth). Some belongs to **one signed-in user** (cart, orders, notifications). If user state lives in app-wide blocs, logging out and in as someone else can briefly show the previous person's cart.

My fix is to give user state its own container that's thrown away when the user changes. Keying it by user id does exactly that. It lives next to `app.dart`, not in `widgets/`, because it wires up features, and shared folders never import features:

```dart:lib/session_scoped_blocs.dart
import 'package:flutter/widgets.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shop/features/auth/presentation/bloc/auth/auth_bloc.dart';
import 'package:shop/features/cart/domain/repositories/cart_repository.dart';
import 'package:shop/features/cart/presentation/bloc/cart/cart_bloc.dart';

/// Blocs that hold one user's data. A new user id means brand-new blocs.
class SessionScopedBlocs extends StatelessWidget {
  const SessionScopedBlocs({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final userId = context.select((AuthBloc bloc) => bloc.state.userId);
    return MultiBlocProvider(
      key: ValueKey(userId),
      providers: [
        BlocProvider(create: (context) => CartBloc(context.read<CartRepository>())),
      ],
      child: child,
    );
  }
}
```

When the key changes, Flutter disposes the old providers, which closes their blocs, and creates fresh ones. No "reset" events for me to remember in every bloc.

### Where things live at run time

| Kind | Created in | Lives for |
| --- | --- | --- |
| Infrastructure (API client, storage, sockets) | `app.dart` repository providers | The whole app |
| App-wide blocs (auth, config, theme) | `app.dart` bloc providers | The whole app |
| User data blocs (cart, orders) | `SessionScopedBlocs` | One signed-in session |
| Screen blocs (a detail page, a form) | The screen itself | While the screen is open |

## The shared folders

I keep code that isn't owned by one feature in five folders, each with a clear job:

| Folder | Holds | Never holds |
| --- | --- | --- |
| `core/` | Networking, storage, session, sockets: the app's plumbing | UI |
| `services/` | One folder per third-party SDK: analytics, ads, attribution, deep links | Business logic |
| `shared/` | Models, entities and feature-specific widgets used by two or more features | Anything only one feature uses |
| `widgets/` | General UI used anywhere: buttons, app bars, dialogs, inputs | Data fetching |
| `utils/` | Pure helpers: date and number formatting, validation | State |

Two things I'd recommend copying:

- **One analytics entry point.** Whether it's Firebase, Mixpanel or AppsFlyer, I wrap every analytics SDK behind one `AppAnalytics` class in `services/`. Screens call `AppAnalytics.track(...)` once and never import three SDKs.
- **`widgets/` vs `shared/widgets/`.** I put general building blocks in `widgets/`. Bigger pieces that a *group* of features share (say, a card reveal animation used by three games) go in `shared/`.

## The dependency rules

```text
presentation/  →  domain/
data/          →  domain/
domain/        →  nothing (pure Dart)

features/      →  core/, shared/, widgets/, services/, utils/, route constants
routing/       →  feature screens
core/, shared/, widgets/, services/, utils/  →  never features/
```

And the one that's easiest to break: **a feature never imports another feature's internals.** If the cart needs a product widget, that widget moves to `shared/` or `widgets/`.

## Enforce it with a test

Dart has no built-in import boundaries, but a plain test can check them. Mine fails the build if shared code imports a feature, or if a domain layer imports Flutter or dio:

```dart:test/architecture_test.dart
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

Iterable<File> dartFiles(String dir) =>
    Directory(dir).listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'));

void main() {
  test('shared code never imports a feature', () {
    const sharedDirs = ['lib/core', 'lib/shared', 'lib/widgets', 'lib/services', 'lib/utils'];
    final offenders = [
      for (final dir in sharedDirs)
        for (final file in dartFiles(dir))
          if (file.readAsStringSync().contains('package:shop/features/')) file.path,
    ];
    expect(offenders, isEmpty);
  });

  test('domain layers are pure Dart', () {
    final offenders = [
      for (final file in dartFiles('lib/features'))
        if (file.path.contains('/domain/') &&
            RegExp(r"import 'package:(flutter|dio)/").hasMatch(file.readAsStringSync()))
          file.path,
    ];
    expect(offenders, isEmpty);
  });
}
```

It's crude, and I'm fine with that. It runs in milliseconds, and it catches the import that would otherwise slip through my review.

## Tests mirror `lib/`

```text
test/
├── core/                    API client, token refresh, storage
├── features/products/       data / domain / presentation, same as lib/
│   └── helpers/             fakes and fixture builders for this feature
├── widgets/                 shared widgets; helpers/pump_app.dart
├── helpers/                 fakes used everywhere (FakeApiClient)
├── fixtures/                real API responses saved as JSON
└── architecture_test.dart
```

Finding a test is never a search for me: it's at the same path as the code, under `test/` instead of `lib/`.

### Fakes, not mocks

Because my repositories are interfaces, I can hand a bloc a tiny fake in a test instead of configuring a mocking library:

```dart:test/features/products/helpers/fake_product_repository.dart
import 'package:shop/features/products/domain/entities/product.dart';
import 'package:shop/features/products/domain/repositories/product_repository.dart';

class FakeProductRepository implements ProductRepository {
  FakeProductRepository({this.products = const [], this.error});

  final List<Product> products;
  final Object? error;

  @override
  Future<List<Product>> getProducts() async {
    if (error != null) throw error!;
    return products;
  }

  @override
  Future<Product> getProduct(String id) async => products.firstWhere((p) => p.id == id);
}
```

```dart:test/features/products/presentation/products_bloc_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:shop/features/products/domain/entities/product.dart';
import 'package:shop/features/products/domain/use_case/get_products.dart';
import 'package:shop/features/products/presentation/bloc/products/products_bloc.dart';

import '../helpers/fake_product_repository.dart';

void main() {
  const shoe = Product(id: '1', name: 'Shoe', price: 49, inStock: true);

  test('loads products', () async {
    final bloc = ProductsBloc(GetProducts(FakeProductRepository(products: [shoe])));
    bloc.add(const ProductsRequested());
    await expectLater(bloc.stream, emitsThrough(const ProductsLoaded([shoe])));
    await bloc.close();
  });
}
```

I like fakes because they're plain Dart, so they're easy to read and they break loudly when the interface changes. For models, I save **real** API responses in `test/fixtures/` and test `fromJson` against them. That catches the backend renaming a field before my users do.

## Outside `lib/`

I care about the rest of the repository too:

```text
my_app/
├── .docs/
│   ├── technical/        How each feature works
│   ├── bugs/             Known issues, each with an id and a status
│   └── impl/             Plans and implementation guides
├── .github/workflows/    CI
├── assets/               Images, Lottie, audio, video, grouped by screen
├── fonts/
├── lib/
├── test/
└── pubspec.yaml
```

And I keep a CI workflow that runs the analyzer and every test on each pull request, so the architecture test above actually gets a vote:

```yaml:.github/workflows/tests.yml
name: tests

on:
  pull_request:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter pub get
      - run: flutter analyze
      - run: flutter test
```

## Where does a new file go?

| You're adding | Put it in |
| --- | --- |
| A REST call | `features/<name>/data/data_source/`, its path in `core/api_endpoints.dart` |
| A new screen | `features/<name>/presentation/screens/`, its route in `routing/` |
| State for a screen | `features/<name>/presentation/bloc/<name>/`: `_bloc`, `_event`, `_state` |
| A model or entity two features use | `shared/models/` or `shared/entities/` |
| A widget two features use | `widgets/<kind>/` |
| A third-party SDK | `services/<sdk>/` |
| App-wide plumbing | `core/` |
| A test | The same path under `test/` |

## Lessons from 1,000 files

- **I pick every folder name once and write it down.** `data_source/` or `data_sources/`, `use_case/` or `use_cases/`: it doesn't matter which, as long as there's one. Mixed spellings are harmless on day one and permanent by day 300, because renaming means touching hundreds of imports.
- **Typos in folder names live forever.** I run a spell checker over new folder names in review, not after.
- **I don't version file names.** `card.dart`, `card_v2.dart` and `card_revamped.dart` side by side means nobody knows which one is live. I replace the old file and let git remember the history.
- **I start a widget inside the feature and promote it later.** It moves to `widgets/` or `shared/` when a second feature actually needs it, not before.
- **I skip layers honestly.** A flat feature is fine when it has no data and no rules. Three layers are for features that do.

None of this is novel. The value is in doing it the same way every time, so that in a thousand-file app I can open any feature and already know where everything is.
