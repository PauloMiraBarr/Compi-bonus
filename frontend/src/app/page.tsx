import { Playground } from "@/components/playground";

// This is a pure Server Component — no "use client" here.
// All interactivity lives inside <Playground />.
export default function Home() {
    return <Playground />;
}
