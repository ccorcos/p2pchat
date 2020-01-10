import * as React from "react"
import * as ReactDOM from "react-dom"
import { App } from "./components/App"
import { css } from "glamor"

css.global("html, body, #root", {
	margin: 0,
	padding: 0,
})

async function main() {
	const root = document.getElementById("root") as HTMLElement
	ReactDOM.render(<App />, root)
}

main()
