# Switchboard - design direction

## Identity

Operations ledger, tuned for intake. Switchboard is the desk where every incoming
message gets read, sorted, and routed. The interface should feel like a control
panel for a team that answers other people all day.

## Audience

Operations, support, and shared-services teams. People handling a mixed queue
where one message is a refund and the next is a meeting request.

## Personality

Orderly, accountable, unemotional. The system explains itself and shows its
reasoning. It never hides a decision behind a spinner.

## Visual language

- Same warm paper and ink foundation as Firstpass, so the two projects read as
  one author's work without being copies.
- Accent is a deep pine teal, used to mark routed and resolved work. Priority
  uses a separate warm and red scale so "handled" and "urgent" never look alike.

## Dials

ENERGY 2 / RHYTHM 2 / MOTION 1

- ENERGY 2: dense but ordered.
- RHYTHM 2: uniform list and table sections, with the approvals queue as the one
  visually distinct block.
- MOTION 1: state feedback only.

## Palette

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| paper | #f4f2ea | #14130f | app background |
| surface | #fbfaf6 | #1b1a14 | panels |
| ink | #1a1914 | #ece7d9 | primary text |
| accent | #0e6b5c | #4fbfa5 | resolved, routed |
| high priority | #a32a2a | #e06a6a | needs attention |
| medium priority | #9c6f14 | #d8a53f | review |
| low priority | #5d7285 | #8aa6bd | informational |

Reason: teal means "the system handled it", the warm scale means "a person needs
to look". Color maps to workflow state, not to decoration.

## Typography

- IBM Plex Sans for the interface, IBM Plex Mono for IDs, counts, confidence, and
  timestamps. Same reasoning as Firstpass: dense data needs tabular figures and a
  face with engineering character.

## Layout

- Left rail navigation with eight sections.
- The dashboard focal point is the live queue, because the queue is the product.
- Decision records use a two-column card grid so a reviewer can scan many at once.

## Motion

Hover and focus feedback only. No entrance animations on a working queue.

## Accessibility

- AA contrast in both themes.
- Visible focus ring on every control.
- Approvals are keyboard operable; the approve and reject actions are real
  buttons with clear labels.

## Out of scope

Demonstration project with generated demo data. Not client work.
