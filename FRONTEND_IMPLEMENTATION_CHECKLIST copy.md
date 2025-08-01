sawp page:
- user can see the token and the chain that implemented. e.g ETH on Ethereum.

- tokenSelection you pay: if user click on token a token selection component opens.
-- in that we have a back button on top left
-- a network selection button that in default sayse All network with a icoon
--- onclick there is chain selection that all network has a selection tick since its default.
-- under it a search bar that you can serch trough the tokens.
-- under that list of tokens that are pinalbe
--- in list of token if token have mutliple chain there would be badge of number of that chain. e.g 1inch support 13 chain for ether. now that badge shows 13
--- if user select the token list of the chains will pop up . with name and their icon

- tokenSelection you receive: shows select token that if you click on it you will open the token selection component

- button: if user wallet not connect shows connect wallet. it have options like thise:

1inch Wallet Scan QR code to connect (opens wallet connect component)

WalletConnect

Rabby Wallet Detected

Browser Wallet

OKX Wallet

More wallets

if user connect it shows swap. if user didn't choose bothe tokens swap is disabled
if user selected both tokens it shows swap information like:
1 WETH
 = 
~$0
0
 
Ξ

Slippage tolerance
Auto
 
1%
Minimum receive
~$317.19 
0.08770245
 
WETH
Network Fee


clicked on swap and got as red warning: 
High price impact! More than 22.82% drop!
and button changed to Permit and swap with explanation that you have hover that shows:
1inch Network uses signed permit approvals. This allows you to approve 1inch smart contract access to your USDC tokens and swap in one single transaction.





I can see there a bitcoin address option if user whants to receive ticoin in to section of sawp. but how to handle from bitcoin to ERC20? bitcoin is not like other chains that can be connected.