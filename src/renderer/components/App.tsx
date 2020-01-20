import * as React from "react"
import { nativeApi } from "../ipc"

type AppState = {
	type: "start"
}

export class App extends React.PureComponent {
	componentDidMount() {
		nativeApi
			.getIdentities()
			.then(console.log)
			.catch(console.error)
	}

	render() {
		return (
			<div style={{ width: "30em", margin: "0 auto", padding: "1em" }}>
				Hello World
			</div>
		)
	}
}
