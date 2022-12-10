import { FC, MouseEventHandler, useCallback, useEffect, useMemo, useState } from "react"
import {
  Button,
  Container,
  Heading,
  HStack,
  Text,
  VStack,
  Image,
  Center,
} from "@chakra-ui/react"
import { ArrowForwardIcon } from "@chakra-ui/icons"
import { useRouter } from "next/router"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { CandyMachine, CandyMachineV2, Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js"
import { PublicKey } from "@solana/web3.js"

interface MyNftInterface {
  name: string;
  image: string;
}

const Connected: FC = () => {
  const router = useRouter()
  const walletAdapter = useWallet();
  const { connection } = useConnection();
  const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(walletAdapter))
  const [isMinting, setIsMinting] = useState(false)
  const [candyMachine, setCandyMachine] = useState<CandyMachineV2>()
  const [nftData, setNftData] = useState<MyNftInterface[]>()

  const fetchNfts = async () => {
    if (!walletAdapter.connected || !walletAdapter.publicKey) {
      return;
    }
    
    const cm = await metaplex.candyMachinesV2().findByAddress({address: new PublicKey("3f3kpvs3RFfyum4tFugK29qexUr1nNPSB3BmdtZvLKS2")})

    if (!cm) {
      return;
    }
    setCandyMachine(cm);

    console.log(candyMachine)
    // fetch off chain metadata for each NFT
    let nftData = []
    for (let i = 0; i < cm.items.length; i++) {
      let fetchResult = await fetch(cm.items[i].uri)
      let json = await fetchResult.json()

      if (json.symbol == "CRAB") {
        nftData.push(json)
        console.log(json)
      }
    }

    // set state
    setNftData(nftData)
  }
  
  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (event) => {
      const candyMachine = await metaplex.candyMachinesV2().findByAddress({address: new PublicKey("3f3kpvs3RFfyum4tFugK29qexUr1nNPSB3BmdtZvLKS2")});

      console.log(candyMachine);
      
      if (event.defaultPrevented) return;
      if (!walletAdapter.connected || !candyMachine) return;
  
      try {
        setIsMinting(true);
        const nft = await metaplex.candyMachinesV2().mint({ candyMachine });        
  
        router.push(`/?mint=${nft.nft.address.toBase58()}`);
      } catch (error) {
        console.log(error);
        alert(error);
      } finally {
        setIsMinting(false);
      }
    },
    [metaplex, walletAdapter, router]
  );  

  useEffect(() => {
    fetchNfts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAdapter, connection])

  return (
    <VStack spacing={20}>
      <Container>
        <VStack spacing={8}>
          <Heading
            color="white"
            as="h1"
            size="2xl"
            noOfLines={1}
            textAlign="center"
          >
            The boiling crab
          </Heading>

          <Text color="bodyText" fontSize="xl" textAlign="center">
            Each Crab is ready to be boiled and eaten. You can boil them in
          </Text>
        </VStack>
      </Container>

      <HStack spacing={10}>
        {nftData && nftData.map((nft) => (
          <Image key={nft.name} src={nft.image} alt={nft.name} width="100" height="100" />
        ))}
      </HStack>

      <Button
          bgColor="accent"
          color="white"
          maxWidth="380px"
          onClick={handleClick}
          disabled={isMinting}
        >
          <HStack>
            <Text>{!isMinting ? 'Mint a crab' : 'wait a bit...'}</Text>
            <ArrowForwardIcon />
          </HStack>
      </Button>
    </VStack>
  )
}

export default Connected