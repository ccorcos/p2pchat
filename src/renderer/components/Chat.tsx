import * as React from "react"

interface AppState {
	inputValue: string
	messages: Array<string>
}

export class App extends React.PureComponent<{}, AppState> {
	state: AppState = { messages: [], inputValue: "" }

	private handleChangeInput = e => {
		this.setState({
			...this.state,
			inputValue: e.target.value,
		})
	}

	private handleSend = () => {
		// TODO: record to log via IPC
		if (this.state.inputValue) {
			this.setState({
				messages: [...this.state.messages, this.state.inputValue],
				inputValue: "",
			})
		}
	}

	private handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			this.handleSend()
		}
	}

	render() {
		return (
			<div style={{ width: "30em", margin: "2em auto" }}>
				<div>
					{this.state.messages.map((message, i) => {
						return (
							<div key={i} style={{ margin: "0.2em 0" }}>
								{message}
							</div>
						)
					})}
					<div style={{ margin: "0.2em 0", display: "flex" }}>
						<input
							value={this.state.inputValue}
							onChange={this.handleChangeInput}
							onKeyDown={this.handleKeyDown}
							style={{ marginRight: 4, flex: 1 }}
							placeholder="Message..."
						/>
						<button onClick={this.handleSend}>send</button>
					</div>
				</div>
			</div>
		)
	}
}
