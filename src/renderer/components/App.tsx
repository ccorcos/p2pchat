import * as React from "react"

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

function useRouter() {
	return React.useState<Route>({ name: "landing" })
}

export function App() {
	const [route, setRoute] = useRouter()

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
	} else if (route.name === "sync") {
		return <div>sync</div>
	} else if (route.name === "onboarding") {
		return <div>onboarding</div>
	} else {
		// 404
		return <div>404</div>
	}
}
