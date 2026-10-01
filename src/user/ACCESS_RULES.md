# Users — Access Rules

## User Role

Role yang melekat langsung pada `User`:

- `SUPER_ADMIN`
- `ADMIN`
- `USER`

Role ini berlaku secara global pada sistem.

## Organization User Role

Role yang melekat pada `OrganizationUser`:

- `OWNER`
- `ADMIN`
- `MEMBER`

Role ini hanya berlaku dalam organization terkait.

## Permissions

| Action           | SUPER_ADMIN | ADMIN | USER |
| ---------------- | :---------: | :---: | :--: |
| View Users       |     ✅      |  ✅   |  ❌  |
| Block User       |     ✅      |  ❌   |  ❌  |
| Activate User    |     ✅      |  ✅   |  ❌  |
| Change User Role |     ✅      |  ❌   |  ❌  |
