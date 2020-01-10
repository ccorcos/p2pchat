import * as React from "react"
import * as ReactDOM from "react-dom"
import { App } from "./components/App"

async function main() {
	const root = document.getElementById("root") as HTMLElement
	ReactDOM.render(<App />, root)
}

main()
