"use client"

import { useState } from "react"
import LandingPage from "@/components/landing-page"
import LoginPage from "@/components/login-page"
import AppDashboard from "@/components/app-dashboard"

export type Route = "landing" | "login" | "app"

export default function Home() {
  const [currentRoute, setCurrentRoute] = useState<Route>("landing")

  const navigate = (route: Route) => {
    setCurrentRoute(route)
  }

  return (
    <>
      {currentRoute === "landing" && <LandingPage onNavigate={navigate} />}
      {currentRoute === "login" && <LoginPage onNavigate={navigate} />}
      {currentRoute === "app" && <AppDashboard onNavigate={navigate} />}
    </>
  )
}
