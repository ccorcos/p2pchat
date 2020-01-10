import * as React from "react"
import {
	RSAKey,
	loadRSAKey,
	createRSAKey,
	writeRSAKey,
} from "../helpers/cryptoHelpers"

export type LandingRoute = {
	name: "landing"
}

export type SyncRoute = {
	name: "sync"
}

export type Onboarding = {
	name: "onboarding"
}

export type Route = LandingRoute | SyncRoute | Onboarding

type Async<T> =
	| { loading: true; value?: undefined; error?: undefined }
	| { loading?: false; value: T; error?: undefined }
	| { loading?: false; value?: undefined; error: Error }

function useRSAKey() {
	const [state, setState] = React.useState<Async<RSAKey | undefined>>({
		loading: true,
	})

	React.useEffect(() => {
		loadRSAKey()
			.then(value => setState({ value }))
			.catch(error => setState({ error }))
	}, [])

	return [state]
}

export function LoggedOut() {
	const [route, setRoute] = React.useState<Route>({ name: "landing" })

	//===============================================================
	// Events.
	//===============================================================

	function handleGetStarted() {
		setRoute({ name: "onboarding" })
	}

	function handleSync() {
		setRoute({ name: "sync" })
	}

	//===============================================================
	// Render.
	//===============================================================

	if (route.name === "landing") {
		return (
			<div>
				<h1>Welcome to P2P Chat!</h1>
				<p>
					This application let's you communicate with others without sending
					your data on any 3rd party services.
				</p>
				<button onClick={handleGetStarted}>Get started</button>
				<button onClick={handleSync}>Sync with another device</button>
			</div>
		)
	} else if (route.name === "onboarding") {
		return <div>onboarding</div>
	} else if (route.name === "sync") {
		// TODO:
		return <div>sync</div>
	}
}

export function App() {
	const [rsaKey] = useRSAKey()

	//===============================================================
	// Loading.
	//===============================================================

	if (rsaKey.loading) {
		return <div>loading...</div>
	}

	if (rsaKey.error) {
		return <div>error: {rsaKey.error}</div>
	}

	if (rsaKey.value) {
		// We're in the app.
		// TODO: build the chat app.
		return <div>app</div>
	}

	return <LoggedOut />
}
