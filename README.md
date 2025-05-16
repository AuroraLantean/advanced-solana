# advanced-solana

## Installation

According to https://solana.com/docs/intro/installation

## Error
### no method named `file` found for reference `&proc_macro::Span` in the current scope
use the following version:
```
rustc 1.87.0 (17067e9ac 2025-05-09)

solana-cli 2.1.22 (src:26944979; feat:1416569292, client:Agave)

anchor-cli 0.31.1

proc_macro 1.0.95 or later
... cargo update -p proc-macro2
... OR cargo update -p proc-macro2 --precise 1.0.95
... OR add it to your cargo toml

rustup update
to get the latest nightly update (yes you need the latest nightly update even though solana uses stable, the idl build uses nightly)
... should return stable-x86_64-unknown-linux-gnu updated - rustc 1.87.0 (17067e9ac 2025-05-09)
and nightly-x86_64-unknown-linux-gnu updated - rustc 1.89.0-nightly (d97326eab 2025-05-15)
```

### failed to start faucet: Unable to bind faucet to 0.0.0.0:9900, check the address is not already in use: Address already in use (os error 98)
```
lsof -i :9900
kill -9 <process id>
```

### command not found: node
See https://solana.stackexchange.com/questions/1648/error-no-such-file-or-directory-os-error-2-error-from-anchor-test/16564#16564