import * as url from "url"
import { parse } from "path"

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

function parseRoute(href: string) {
	const parsed = url.parse(href, true)
	if (parsed.pathname === "/") {
	}
	if (parsed.pathname === "/sync") {
	}
}
