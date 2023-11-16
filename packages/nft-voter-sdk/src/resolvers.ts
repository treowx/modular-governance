import { ataResolver, combineResolvers, resolveIndividual } from "@helium/anchor-resolvers";
import { PROGRAM_ID } from "./constants";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { delegationKey, nftDelegationResolvers } from "@helium/nft-delegation-sdk";
import { init } from ".";

const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const nftVoterProgramResolver: anchor.CustomAccountResolver<any> =
  resolveIndividual(async ({ path }) => {
    if (path[path.length - 1] === "nftVoterProgram") {
      return PROGRAM_ID;
    } else if (path[path.length - 1] == "tokenMetadataProgram") {
      return 
    }
  });

export const nftVoterResolvers: anchor.CustomAccountResolver<any> = combineResolvers(
  nftVoterProgramResolver,
  nftDelegationResolvers,
  resolveIndividual(async ({ path, provider, accounts, programId }) => {
    if (path[path.length - 1] == "proposalProgram" && accounts.proposal) {
      const acct = await provider.connection.getAccountInfo(
        accounts.proposal as PublicKey
      );
      return acct.owner;
    } else if (path[path.length - 1] == "metadata" && accounts.mint) {
      return PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata", "utf-8"),
          METADATA_PROGRAM_ID.toBuffer(),
          (accounts.mint as PublicKey).toBuffer(),
        ],
        METADATA_PROGRAM_ID
      )[0];
    } else if (path[path.length - 1] == "delegation" && accounts.nftVoter && accounts.owner && accounts.mint) {
      const program = await init(provider as any, programId)
      const nftVoter = await program.account.nftVoterV0.fetch(accounts.nftVoter as PublicKey)
      console.log(
        "HEHEH",
        nftVoter.delegationConfig,
        accounts.mint,
        accounts.owner,
        delegationKey(
          nftVoter.delegationConfig,
          accounts.mint as PublicKey,
          accounts.owner as PublicKey
        )[0]
      );
      return delegationKey(
        nftVoter.delegationConfig,
        accounts.mint as PublicKey,
        accounts.owner as PublicKey,
      )[0]
    }
  }),
  ataResolver({
    instruction: "initializeTokenVoterV0",
    account: "tokenAccount",
    mint: "collection",
    owner: "tokenVoter",
  }),
  ataResolver({
    instruction: "voteV0",
    account: "tokenAccount",
    mint: "mint",
    owner: "voter",
  }),
  ataResolver({
    instruction: "relinquishVoteV0",
    account: "tokenAccount",
    mint: "mint",
    owner: "voter",
  })
);
