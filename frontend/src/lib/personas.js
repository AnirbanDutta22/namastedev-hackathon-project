// Mirrors backend/app/agents/ai_agent.py PERSONAS. Kept static on the
// frontend so the character-select screen never has to wait on a network
// round trip before the user can start picking.
export const PERSONAS = [
  {
    id: "red",
    name: "Red AI",
    callsign: "THE BREACHER",
    color: "#ff3b4e",
    tagline: "Smash-and-grab",
    doctrine:
      "Goes straight for the highest-value target in the room. Loud, fast, opportunistic — every open port is an invitation.",
    trait: "Prioritizes risk score. Fastest path to the crown jewel.",
    glyph: "R",
  },
  {
    id: "blue",
    name: "Blue AI",
    callsign: "THE GHOST",
    color: "#2f8bff",
    tagline: "Low and slow",
    doctrine:
      "A patient adversary-emulation persona that avoids anything that might trip an alert. Quiet hops first, loud targets last.",
    trait: "Prioritizes stealth. Slips past the loudest nodes.",
    glyph: "B",
  },
  {
    id: "insider",
    name: "Insider AI",
    callsign: "THE MOLE",
    color: "#ffb454",
    tagline: "Already trusted",
    doctrine:
      "Starts inside the perimeter with legitimate access. Doesn't break in — abuses the trust it already has to reach critical assets directly.",
    trait: "Prioritizes asset criticality over subtlety.",
    glyph: "I",
  },
];

export function getPersona(id) {
  return PERSONAS.find((p) => p.id === id) || PERSONAS[0];
}
