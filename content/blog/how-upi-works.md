---
title: "How UPI works: what happens in the two seconds after you tap Pay"
date: 2026-11-05
excerpt: Your money never sits in PhonePe or Google Pay. Here's how UPI's central switch, banks, PIN and settlement fit together, how it survives a payment that half-fails and a small TypeScript sketch of the core idea.
tags: [System Design, Payments, Architecture]
---

In my [backend post](/blog/nodejs-backend-structure), I showed the one function that's allowed to change a wallet balance, and the build check that keeps it that way. That's one app and one database.

UPI has the same problem across hundreds of banks, at around **24 billion transactions a month** in 2026, over 800 million a day ([NPCI statistics](https://www.npci.org.in/what-we-do/upi/product-statistics)). I wanted to understand what actually happens between scanning a QR and the shop's speaker saying "payment received". So I worked through it as a backend developer would: the pieces, the messages and what happens when something fails halfway.

## The idea in one sentence

**UPI is a switch, not a wallet: NPCI routes messages between banks, the banks move the money and the apps are just the front door.**

Here's how the pieces fit, starting with who's involved.

## Who's involved

Five kinds of party take part in every payment:

| Party | Example | What it does |
| --- | --- | --- |
| **UPI app** | PhonePe, Google Pay, Paytm, your bank's app | The UI: your VPA, QR scanning, history. Holds no money |
| **PSP bank** | The bank partnered with that app | Connects the app to UPI and owns the `@handle` (like `@okaxis`) |
| **NPCI switch** | Run by the National Payments Corporation of India | Routes every message, resolves addresses, keeps the record of every transaction |
| **Remitter bank** | Your bank | Checks your UPI PIN and debits your account |
| **Beneficiary bank** | The receiver's bank | Credits their account |

The most important line in that table is **"Holds no money"**. When you pay from PhonePe, PhonePe never touches the rupees. It asks its PSP bank to send a message, and the money moves between your bank and the receiver's bank.

## Your address: the VPA

A VPA (virtual payment address) like `jarvis@okaxis` stands in for an account number and IFSC code.

```text
jarvis@okaxis
│      └── handle: which PSP bank owns this address
└──────── username: chosen by the user, mapped to an account by that PSP
```

The handle tells NPCI which PSP to ask. That PSP knows which real bank account `jarvis` points to, and nobody else needs to. You never see Jarvis's account number, and he never sees yours.

That's also why you see "Jarvis Kumar" before you pay. Your app asks NPCI to validate the address, NPCI asks the PSP that owns `@okaxis`, and the registered name comes back.

## A payment, step by step

This is a normal "Pay" (a push payment, where the payer starts it):

```text
You tap Pay
   │
   ▼
Your app ──► Your PSP bank ──► NPCI switch
                                  │
                                  ├─1─► Payee's PSP:   "who is jarvis@okaxis?"  → account details
                                  │
                                  ├─2─► Remitter bank: verify PIN, check balance and limits, DEBIT
                                  │
                                  ├─3─► Beneficiary bank: CREDIT Jarvis's account
                                  │
                                  └─4─► Response to both sides: your app shows ✓, his speaker talks
```

1. **Pay request.** Your app builds a request with the payee's VPA, the amount, your encrypted PIN and a **transaction id that's unique across all of UPI**. Your PSP bank sends it to NPCI.
2. **Resolve.** NPCI asks the payee's PSP which account `jarvis@okaxis` maps to.
3. **Debit.** NPCI sends the debit to your bank. Your bank decrypts the PIN, checks your balance and limits and then debits your account.
4. **Credit.** NPCI tells Jarvis's bank to credit his account.
5. **Respond.** The result goes back to both PSPs. Your app shows a tick and the merchant's app or speaker announces it.

All of that usually finishes in a couple of seconds.

### Money moves now, banks settle later

Here's the part that surprised me. Your account is debited and Jarvis's is credited in real time, but **the banks don't pay each other per transaction**.

NPCI adds up what every bank owes every other bank and works out one net figure per bank. Those net amounts are settled through the banks' accounts at the RBI in batches, several times a day. If your bank's customers sent ₹500 crore to customers of Jarvis's bank in a cycle, and Jarvis's bank's customers sent back ₹480 crore, only ₹20 crore actually moves between the two banks.

**Real-time for people, batched for banks.** That's what lets it scale: 800 million inter-bank transfers a day become a few net transfers per bank per cycle.

## Security: two factors, and the app sees neither

Every UPI payment needs two things.

### Something you have: device binding

When you set up a UPI app, it sends an SMS from your phone's SIM to a number run by the PSP. That proves the SIM with your bank-registered mobile number is in this phone. Your number, the device and the app are now bound together. Move the SIM to another phone, and you have to bind again.

### Something you know: the UPI PIN

You set the PIN once per bank account, using your debit card details or an Aadhaar OTP. The important design choice is **where you type it**.

The PIN screen isn't drawn by PhonePe or Google Pay. It's NPCI's **Common Library**, a secure keypad component that every UPI app embeds. It encrypts the PIN before the app gets anything, and only your bank can decrypt it. The app forwards an encrypted blob it can't read.

That's why a UPI app being hacked doesn't leak PINs: the app never had them.

## When a payment half-fails

The happy path is easy. Most of UPI's engineering goes into the in-between cases, and the worst one is this:

> Your account was debited, and then the credit timed out. Your money has left, and nobody knows yet if it arrived.

Three rules make this safe.

### 1. Every step is idempotent

The transaction id goes with every message, and every party dedupes on it. If NPCI resends a debit because a response got lost, your bank sees a transaction id it has already processed and returns the earlier result instead of debiting again.

### 2. Check status, never pay again

If an app doesn't hear back, it doesn't send a new payment. It asks for the status of the transaction id it already sent. That's why apps show "Payment pending" instead of a retry button.

### 3. Pending payments get settled, by force if needed

A transaction stuck after the debit is marked pending (UPI calls it "deemed"). A status check then asks the beneficiary bank what really happened: if the money arrived, it's marked a success, and if it didn't, the debit is reversed.

The RBI puts a deadline on this. For a UPI transfer that debited you but never reached the receiver, the reversal has to happen by **T+1** (the day after). For a merchant payment, it's **T+5**. If a bank misses that, it owes the customer **₹100 for every day of delay** ([RBI circular](https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=11693)). A fine like that means banks put real effort into their reconciliation jobs.

### Reconciliation

Every settlement cycle, each bank compares its own records against NPCI's. Any transaction that's a success on one side and missing or failed on the other gets flagged and fixed. In the end, the ledger is the source of truth, not any single response message.

## The core idea in code

If I were building a tiny version of the switch, this is the shape it would take. It's a sketch of the idea, not NPCI's code:

```ts:mini-upi/pay.ts
type TxnState = 'INITIATED' | 'DEBITED' | 'SUCCESS' | 'DEEMED' | 'REVERSED' | 'FAILED';

// Every step is keyed by txnId, so a retried message never moves money twice.
export async function handlePay(req: PayRequest) {
  const txn = await Txn.findOneAndUpdate(
    { txnId: req.txnId },
    { $setOnInsert: { ...req, state: 'INITIATED' } },
    { upsert: true, new: true },
  );
  if (txn.state !== 'INITIATED') return txn; // already seen: answer, don't redo

  const debit = await remitterBank.debit(txn); // checks PIN, balance and limits
  if (!debit.ok) return markState(txn, 'FAILED', debit.reason);
  await markState(txn, 'DEBITED');

  const credit = await withTimeout(beneficiaryBank.credit(txn), CREDIT_TIMEOUT_MS);
  if (credit.ok) return markState(txn, 'SUCCESS');
  if (credit.timedOut) return markState(txn, 'DEEMED'); // the status job decides later

  await remitterBank.reverse(txn);
  return markState(txn, 'REVERSED');
}
```

And the job that clears up anything left pending:

```ts:mini-upi/status-check.job.ts
// Runs every few minutes: ask the beneficiary bank what really happened.
export async function resolveDeemed() {
  for (const txn of await Txn.find({ state: 'DEEMED' })) {
    const status = await beneficiaryBank.checkStatus(txn.txnId);

    if (status === 'CREDITED') await markState(txn, 'SUCCESS');
    if (status === 'NOT_CREDITED') {
      await remitterBank.reverse(txn);
      await markState(txn, 'REVERSED');
    }
    // UNKNOWN: leave it for the next run, and for reconciliation
  }
}
```

The states are the whole design:

```text
INITIATED ──debit ok──► DEBITED ──credit ok──────► SUCCESS
    │                      │
 debit fails            credit fails ──► reverse ──► REVERSED
    │                      │                            ▲
    ▼                   timeout                         │
  FAILED                   ▼                            │
                        DEEMED ──status: not credited───┘
                           └────status: credited──────► SUCCESS
```

Notice there's no arrow out of `DEBITED` that just gives up. Once money has left an account, every path ends in either **it arrived** or **it came back**.

## Everything else runs on the same switch

Once the switch, VPAs and the PIN exist, new products are mostly new message types:

- **QR codes.** A static QR is basically just a VPA. A dynamic QR adds the amount and an order reference. Scanning either one leads into the same pay request.
- **Collect requests (pull).** The payee asks and the payer approves with their PIN. Fraudsters used fake "collect" requests to trick people into paying, so NPCI stopped **person-to-person** collect requests from 1 October 2025. Merchant collect requests, like checkout on a shopping app, still work.
- **UPI AutoPay.** You approve a mandate once with your PIN, and the merchant can debit on a schedule within its limits. It's how subscriptions work on UPI.
- **UPI Lite.** A small balance held on your device for small payments without a PIN: up to ₹1,000 a payment and ₹5,000 in the balance. Those payments don't hit your bank's core system one by one, and that system is usually the bottleneck.
- **UPI 123Pay.** UPI for feature phones, through IVR calls and other non-smartphone flows.
- **Credit on UPI.** RuPay credit cards and bank credit lines linked to a VPA, so a QR payment can go on credit.

## Where it breaks in real life

When a UPI payment fails, it's rarely UPI itself:

- **"Your bank's server is down."** The remitter bank's core banking system is slow or offline. NPCI is fine, but your bank can't answer a debit. This is the most common failure, and taking load off bank systems is a big reason UPI Lite exists.
- **Pending for hours.** The debit worked and the credit timed out. The status checks and the T+1 rule above are what get your money back.
- **Paid the wrong person.** A push payment you approved with your PIN is final. There's no automatic reversal. You have to raise a complaint through your app or bank and hope the receiver cooperates. Check the name before you pay; that's what it's there for.
- **Scams.** Nearly all UPI fraud tricks a person into entering their PIN, rather than breaking the system. The rule that protects you: **you only ever enter your PIN to send money, never to receive it.**

## Why don't the apps just hold the money?

Wallets did exactly that: you loaded money into the app, and the app moved it between its own users. That works inside one company, but the money is stuck in that company, and every company needs its own licence, balance and float.

UPI flipped it. The money stays in bank accounts that already exist, so **any app can pay anyone at any bank**. That's why PhonePe users can pay Google Pay users, and why apps compete on the experience instead of on who holds your money.

## The whole thing at a glance

| Piece | What it does |
| --- | --- |
| **VPA** | An address that hides your account number. The handle says which PSP to ask |
| **NPCI switch** | Routes messages, resolves addresses, keeps the record of every transaction |
| **Device binding** | Something you have: an SMS from your SIM ties the app to your number |
| **UPI PIN** | Something you know: typed into NPCI's keypad, readable only by your bank |
| **Transaction id** | Makes every step idempotent, so retries never double-debit |
| **Deemed + status check** | Turns "we don't know" into success or reversal |
| **T+1 / T+5 and ₹100 a day** | The RBI deadline that makes banks fix stuck payments |
| **Net settlement** | Real-time for people, batched for banks |
| **Reconciliation** | Every cycle, every bank's records are matched against NPCI's |

Two seconds, five parties and two banks that won't settle up until later, and it still works 800 million times a day. That's what good boring design looks like: no step trusts a single response, and the ledger always has the last word.
