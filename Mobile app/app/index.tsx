import { Redirect } from "expo-router";

export default function Index() {
  // Redirect to onboarding by default when the app opens
  return <Redirect href="/onboarding" />;
}
