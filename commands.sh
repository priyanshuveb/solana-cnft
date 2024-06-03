# pubkey: EVDVp1miKUdGR3Y9PcckUAxmXNaZNS85AHchJaaKFkh9
# seed: local heavy cool reduce rely good aisle census dinner timber airport setup
solana-keygen new --no-bip39-passphrase --outfile ./owner.json
solana config set --keypair ./owner.json
solana config get

# pubkey: 2TFQh2bpXXTJvT1SSKNk16H6NgT2yytpKkug6Vf639eo
# seed: element minute drip waste long melody entire major grocery very rookie know
solana-keygen new --no-bip39-passphrase --outfile ./user.json 

solana airdrop
solana balance