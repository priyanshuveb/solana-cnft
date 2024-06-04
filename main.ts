import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplBubblegum, createTree, mintToCollectionV1, findLeafAssetIdPda, mintV1, getAssetWithProof, verifyCollection, setAndVerifyCollection, UpdateArgsArgs, updateMetadata, TokenStandard } from '@metaplex-foundation/mpl-bubblegum'
import { publicKey, generateSigner, keypairIdentity, createSignerFromKeypair, percentAmount, none, some } from '@metaplex-foundation/umi'
import {
    fetchMerkleTree,
    fetchTreeConfigFromSeeds,
} from '@metaplex-foundation/mpl-bubblegum'
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import * as bs58 from 'bs58';
import secretKey from './owner.json'

// Use the RPC endpoint of your choice.
const umi = createUmi('https://api.devnet.solana.com').use(mplBubblegum()).use(mplTokenMetadata()).use(dasApi())

// Create a keypair from your secret key
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secretKey))
const keypairSigner = createSignerFromKeypair(umi, keypair);

// Register it to the Umi client.
umi.use(keypairIdentity(keypair))



async function buildMerkleTree() {

    // Creates a random signer
    const merkleTree = generateSigner(umi)
    console.log({ merkleTree });

    /*
    To find what values you should be using for @maxDepth and @maxBufferSize refer 
    this link, it is not arbitrary and depends upon your nft collection size.
    Link: https://developers.metaplex.com/bubblegum/create-trees 
    
    @public param indicated whether or not anyone can mint cNFTs from the tree.
    @treeCreator param if not set defaults to umi identity, otherwise you can set it manually
    */
    const builder = await createTree(umi, {
        merkleTree,
        maxDepth: 3,
        maxBufferSize: 8,
        public: true,
        // treeCreator: keypairSigner
    })


    await builder.sendAndConfirm(umi)

}

async function mintCollection() {

    const collectionMint = generateSigner(umi)
    console.log({ collectionMint });

    const { signature } = await createNft(umi, {
        mint: collectionMint,
        authority: keypairSigner,
        name: 'SuperModels',
        symbol: 'MODEL',
        uri: 'https://raw.githubusercontent.com/priyanshuveb/solana-cnft/main/assets/collection.json',
        sellerFeeBasisPoints: percentAmount(0, 2), // 5%
        isCollection: true,
    }).sendAndConfirm(umi)

    const txid = bs58.encode(signature)
    console.log({ txid })
}

async function fetch() {

    const merkleTree = publicKey('DY2kqECacr2AH4AJ6BDPEZMzYRTdxZ6vpsXHUk6hdJLA')
    // const merkleTreeAccount = await fetchMerkleTree(umi, merkleTree)
    const treeConfig = await fetchTreeConfigFromSeeds(umi, { merkleTree })
    //console.log({merkleTreeAccount});
    console.log({ treeConfig });

}

async function mintCnftToCollection() {

    const collectionMint = publicKey('3ZPzxJCB1zd3Rq5VRdjy7EMHiwzcCUfuaXJ33TTzEfWn')
    const merkleTree = publicKey('DY2kqECacr2AH4AJ6BDPEZMzYRTdxZ6vpsXHUk6hdJLA')
    const leafOwner = publicKey('2TFQh2bpXXTJvT1SSKNk16H6NgT2yytpKkug6Vf639eo')

    const { signature } = await mintToCollectionV1(umi, {
        leafOwner,
        merkleTree,
        collectionMint,
        collectionAuthority: keypairSigner,
        metadata: {
            name: 'Model #2',
            symbol: 'MODEL',
            uri: 'https://raw.githubusercontent.com/priyanshuveb/solana-cnft/main/assets/3.json',
            sellerFeeBasisPoints: 500, // 5%
            collection: { key: collectionMint, verified: false },
            creators: [
                { address: umi.identity.publicKey, verified: false, share: 100 },
            ],
        },
    }).sendAndConfirm(umi)

    const txid = bs58.encode(signature)
    console.log({ txid })
}

async function mintCnft() {
    const merkleTree = publicKey('DY2kqECacr2AH4AJ6BDPEZMzYRTdxZ6vpsXHUk6hdJLA')
    await mintV1(umi, {
        leafOwner: umi.identity.publicKey,
        merkleTree,
        metadata: {
            name: 'Model #3',
            symbol: 'MODEL',
            uri: 'https://raw.githubusercontent.com/priyanshuveb/solana-cnft/main/assets/3.json',
            sellerFeeBasisPoints: 500, // 5%
            collection: none(),
            creators: [
                { address: umi.identity.publicKey, verified: false, share: 100 },
            ],
        },
    }).sendAndConfirm(umi)
}

async function getAssetId(leafIndex: number) {
    const merkleTree = publicKey('DY2kqECacr2AH4AJ6BDPEZMzYRTdxZ6vpsXHUk6hdJLA')
    // const leafIndex = 0
    const [assetId, bump] = await findLeafAssetIdPda(umi, {
        merkleTree,
        leafIndex,
    })
    console.log({ assetId });
    return assetId


}

async function fetchCnftByAssetId() {
    const leafIndex = 1
    const assetId = await getAssetId(leafIndex)
    const rpcAsset = await umi.rpc.getAsset(assetId)
    console.log(rpcAsset.creators);
    console.log({rpcAsset});
   // return rpcAsset.content.metadata

}

async function fetchCnftByOwner() {
    // Fetch all CNFTs for an address
    const owner = publicKey(keypairSigner.publicKey)
    const rpcAssetList = await umi.rpc.getAssetsByOwner({ owner })
    console.log({ rpcAssetList });
    console.log(rpcAssetList.items);
}

async function fetchCnftByCollection() {
    const collectionMint = publicKey('3ZPzxJCB1zd3Rq5VRdjy7EMHiwzcCUfuaXJ33TTzEfWn')

    const rpcAssetList = await umi.rpc.getAssetsByGroup({
        groupKey: 'collection',
        groupValue: collectionMint,
    })

    console.log({ rpcAssetList });

}

async function setCollectionToMerkleTree() {
    const collectionMint = publicKey('3ZPzxJCB1zd3Rq5VRdjy7EMHiwzcCUfuaXJ33TTzEfWn')
    const assetId = publicKey('Giv5bUZhgyma4x6fsaXHMME4FSzZtSYTaz7E93deBtWC')

    const assetWithProof = await getAssetWithProof(umi, assetId)
    await setAndVerifyCollection(umi, {
        ...assetWithProof,
        treeCreatorOrDelegate: keypairSigner,
        collectionMint,
        collectionAuthority: keypairSigner,
    }).sendAndConfirm(umi)
}
async function verifyAsset() {
    const collectionMint = publicKey('3ZPzxJCB1zd3Rq5VRdjy7EMHiwzcCUfuaXJ33TTzEfWn')
    const leafIndex = 2
    const assetId = publicKey('Giv5bUZhgyma4x6fsaXHMME4FSzZtSYTaz7E93deBtWC')
    const assetWithProof = await getAssetWithProof(umi, assetId)
    const { signature } = await verifyCollection(umi, {
        ...assetWithProof,
        collectionMint,
        collectionAuthority: keypairSigner,
    }).sendAndConfirm(umi)

    const txid = bs58.encode(signature)
    console.log({ txid })
}

async function updateCnft() {

    const collectionMint = publicKey('3ZPzxJCB1zd3Rq5VRdjy7EMHiwzcCUfuaXJ33TTzEfWn')
    const leafIndex = 1
    const assetId = await getAssetId(leafIndex)
    // Use the helper to fetch the proof.
    const assetWithProof = await getAssetWithProof(umi, assetId)
    // console.log({assetWithProof});

    // Then we can use it to update metadata for the NFT.
    const updateArgs: UpdateArgsArgs = {
        //name: some('New name'),
        uri: some('https://raw.githubusercontent.com/priyanshuveb/solana-cnft/main/assets/2.json'),
    }
    const {signature} = await updateMetadata(umi, {
        ...assetWithProof,
        leafOwner: assetWithProof.leafOwner,
        updateArgs,
        authority: umi.identity,
        collectionMint: collectionMint,
        currentMetadata: assetWithProof.metadata
    }).sendAndConfirm(umi)

    const txid = bs58.encode(signature)
    console.log({ txid })
}


//buildMerkleTree()
//fetch()
//mintCollection()
//mintCnftToCollection()
//mintCnft()
//getAssetId()
//fetchCnftByAssetId()
//fetchCnftByOwner()
//fetchCnftByCollection()
//setCollectionToMerkleTree()
//verifyAsset()
updateCnft()
