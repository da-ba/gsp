/**
 * Mermaid diagram types and templates
 *
 * Provides predefined diagram templates for common Mermaid diagram types
 * that can be inserted into GitHub markdown.
 */

import { filterAndSort } from "../../../utils/filter-sort.ts"

/** Diagram categories */
export type DiagramCategory = "flow" | "sequence" | "class" | "state" | "other"

/** Mermaid diagram template */
export type DiagramTemplate = {
  id: string
  category: DiagramCategory
  label: string
  description: string
  /** Mermaid code template */
  template: string
}

/** Category labels for display */
export const DIAGRAM_CATEGORY_LABELS: Record<DiagramCategory, string> = {
  flow: "Flowchart",
  sequence: "Sequence",
  class: "Class",
  state: "State",
  other: "Other",
}

/** Available diagram templates */
export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  // Flowcharts
  {
    id: "flowchart-basic",
    category: "flow",
    label: "Basic Flowchart",
    description: "Simple top-to-bottom flowchart",
    template: `\`\`\`mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\``,
  },
  {
    id: "flowchart-lr",
    category: "flow",
    label: "Left to Right Flow",
    description: "Horizontal flowchart",
    template: `\`\`\`mermaid
flowchart LR
    A[Input] --> B[Process]
    B --> C[Output]
\`\`\``,
  },
  {
    id: "flowchart-subgraph",
    category: "flow",
    label: "Subgraph Flow",
    description: "Flowchart with grouped sections",
    template: `\`\`\`mermaid
flowchart TB
    subgraph Frontend
        A[UI] --> B[API Client]
    end
    subgraph Backend
        C[API Server] --> D[Database]
    end
    B --> C
\`\`\``,
  },

  // Sequence diagrams
  {
    id: "sequence-basic",
    category: "sequence",
    label: "Basic Sequence",
    description: "Simple request-response sequence",
    template: `\`\`\`mermaid
sequenceDiagram
    participant Client
    participant Server
    Client->>Server: Request
    Server-->>Client: Response
\`\`\``,
  },
  {
    id: "sequence-auth",
    category: "sequence",
    label: "Auth Flow",
    description: "Authentication sequence diagram",
    template: `\`\`\`mermaid
sequenceDiagram
    participant User
    participant App
    participant Auth
    participant API
    User->>App: Login
    App->>Auth: Authenticate
    Auth-->>App: Token
    App->>API: Request + Token
    API-->>App: Data
    App-->>User: Show Data
\`\`\``,
  },
  {
    id: "sequence-loop",
    category: "sequence",
    label: "Loop Sequence",
    description: "Sequence with loop and conditions",
    template: `\`\`\`mermaid
sequenceDiagram
    participant A
    participant B
    loop Every minute
        A->>B: Ping
        B-->>A: Pong
    end
    alt Success
        A->>B: Process
    else Failure
        A->>B: Retry
    end
\`\`\``,
  },

  // Class diagrams
  {
    id: "class-basic",
    category: "class",
    label: "Basic Class",
    description: "Simple class diagram",
    template: `\`\`\`mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +fetch()
    }
    Animal <|-- Dog
\`\`\``,
  },
  {
    id: "class-interface",
    category: "class",
    label: "Interface Diagram",
    description: "Classes with interfaces",
    template: `\`\`\`mermaid
classDiagram
    class IRepository {
        <<interface>>
        +find(id)
        +save(entity)
        +delete(id)
    }
    class UserRepository {
        +find(id)
        +save(entity)
        +delete(id)
    }
    IRepository <|.. UserRepository
\`\`\``,
  },

  // State diagrams
  {
    id: "state-basic",
    category: "state",
    label: "Basic State",
    description: "Simple state machine",
    template: `\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start
    Processing --> Complete: Done
    Processing --> Error: Fail
    Error --> Idle: Reset
    Complete --> [*]
\`\`\``,
  },
  {
    id: "state-order",
    category: "state",
    label: "Order States",
    description: "Order lifecycle state diagram",
    template: `\`\`\`mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Confirmed: Confirm
    Confirmed --> Shipped: Ship
    Shipped --> Delivered: Deliver
    Delivered --> [*]
    Pending --> Cancelled: Cancel
    Confirmed --> Cancelled: Cancel
    Cancelled --> [*]
\`\`\``,
  },

  // Other diagrams
  {
    id: "pie-chart",
    category: "other",
    label: "Pie Chart",
    description: "Simple pie chart",
    template: `\`\`\`mermaid
pie title Distribution
    "Category A" : 40
    "Category B" : 30
    "Category C" : 20
    "Category D" : 10
\`\`\``,
  },
  {
    id: "gantt-chart",
    category: "other",
    label: "Gantt Chart",
    description: "Project timeline",
    template: `\`\`\`mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
    Task 1: a1, 2024-01-01, 30d
    Task 2: a2, after a1, 20d
    section Phase 2
    Task 3: b1, after a2, 25d
    Task 4: b2, after b1, 15d
\`\`\``,
  },
  {
    id: "er-diagram",
    category: "other",
    label: "ER Diagram",
    description: "Entity-relationship diagram",
    template: `\`\`\`mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "ordered in"
    USER {
        int id PK
        string name
        string email
    }
    ORDER {
        int id PK
        date created_at
    }
\`\`\``,
  },
  {
    id: "git-graph",
    category: "other",
    label: "Git Graph",
    description: "Git branch visualization",
    template: `\`\`\`mermaid
gitGraph
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout main
    merge feature
    commit
\`\`\``,
  },
]

/** Category display order */
const CATEGORY_ORDER: DiagramCategory[] = ["flow", "sequence", "class", "state", "other"]

/** Filter and sort templates by query */
export function getFilteredTemplates(query: string): DiagramTemplate[] {
  return filterAndSort({
    items: DIAGRAM_TEMPLATES,
    query,
    searchFields: [
      (tmpl) => tmpl.id,
      (tmpl) => tmpl.label,
      (tmpl) => tmpl.description,
      (tmpl) => tmpl.category,
      (tmpl) => DIAGRAM_CATEGORY_LABELS[tmpl.category],
    ],
    categoryOrder: CATEGORY_ORDER,
    getCategory: (tmpl) => tmpl.category,
  })
}

/** Get search suggestions */
export function getDiagramSuggestions(): string[] {
  return ["flowchart", "sequence", "class", "state", "pie", "gantt"]
}
