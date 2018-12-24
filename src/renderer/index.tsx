import * as React from "react"
import * as ReactDOM from "react-dom"
import { App } from "./components/App"
import { loadRsaKey } from "./helpers/cryptoHelpers"

async function main() {
	const rsaKey = await loadRsaKey()

	const root = document.getElementById("root") as HTMLElement
	ReactDOM.render(<App />, root)
}

main()
