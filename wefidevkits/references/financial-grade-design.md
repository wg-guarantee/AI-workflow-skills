# Financial-Grade Design Baseline

Use this baseline whenever the task touches money movement, balances, settlement, payment state transitions, reconciliation, or regulated audit trails.

## Core Rule

Do not optimize for speed of implementation at the expense of transactional safety, auditability, or reversibility.

## 1. Atomicity And Consistency

- Balance change and journal creation must be treated as one atomic unit.
- Local balance-affecting operations should run inside one strong database transaction.
- Cross-service money movement must define an explicit distributed consistency pattern such as TCC, Saga, or transactional messaging.
- Every irreversible operation path must define a reversal or compensation path.

### Design Questions

- What is the transaction boundary?
- Which records must commit or roll back together?
- If one downstream step fails, what compensating action restores consistency?
- Which interface performs reversal, and under what trigger?

## 2. Idempotency And Replay Safety

- Every write request must carry a globally unique idempotency key such as `request_id` or `out_trade_no`.
- The domain model must use an explicit state machine, not free-form status mutation.
- State transitions must only happen from allowed predecessor states.
- The database must enforce uniqueness on the idempotency key as a last-line physical defense.

### Design Questions

- What is the idempotency key?
- Where is it stored and uniquely indexed?
- What happens on duplicate submit or retry?
- Which transitions are legal for each transaction state?

## 3. Tamper Resistance And Data Integrity

- Core interfaces should support signing and signature verification.
- Critical account-like rows should support a digest or checksum to detect tampering.
- Balance updates should use optimistic locking or another explicit concurrency guard.
- No financial write path should assume trusted infrastructure alone is enough protection.

### Design Questions

- Which payloads are signed?
- Which fields are covered by the digest?
- What is the versioning or optimistic lock field?
- How is tampering detected and escalated?

## 4. Auditability And Traceability

- Every balance change must leave a journal record before or together with ledger impact.
- Never update stored balances without an auditable journal trail.
- Sensitive operations must record operator identity, timestamp, source IP, action, and before/after values when applicable.
- Historical journal data may be archived, but it must remain searchable for investigations and regulatory review.

### Design Questions

- Where is the journal written?
- Can a balance change happen without a journal row?
- Which audit fields are mandatory?
- What is the retrieval path for archived records?

## 5. Financial Safety Controls

- Reconciliation must exist as an automated routine, both internal and external when third-party channels exist.
- The system must enforce per-transaction, daily, or monthly limits where relevant.
- Large or abnormal outflows must trigger circuit breaking, throttling, or manual review.
- Safety controls must be testable, not just described in prose.

### Design Questions

- What are the limit dimensions and thresholds?
- How are reconciliation mismatches detected and alerted?
- What flow triggers manual review?
- What condition trips the circuit breaker?

## Workflow Mapping

### During `wefi-scope`

- Require explicit transaction boundaries, reversal strategy, idempotency model, and audit trail design.
- Reject vague statements like "update balance and write logs later".

### During `wefi-sequence`

- Convert each principle into concrete implementation tasks, schema changes, and verification steps.
- Include exact checks for unique indexes, state transition guards, signatures, optimistic locking, journal writes, reconciliation, and limits.

### During `wefi-execute`

- Stop if the approved plan lacks a safe transactional boundary for money movement.
- Stop if a write path lacks idempotency or a physical uniqueness constraint.
- Stop if the implementation would mutate balances without journaling or audit evidence.

### During `wefi-root-trace`

- Investigate duplicate requests, inconsistent state transitions, journal-ledger divergence, failed compensation, optimistic locking conflicts, and reconciliation drift.

### During `wefi-exit-check`

- Do not claim completion until transactional safety, idempotency, auditability, and reconciliation checks all have concrete evidence.
