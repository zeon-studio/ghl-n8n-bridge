# GHL n8n Bridge Skill

This skill empowers AI agents to seamlessly integrate and automate GoHighLevel (GHL) workflows using the specialized **GHL Bridge** nodes in n8n. These nodes leverage a Token Broker backend to simplify authentication and provide robust access to GHL V2 APIs.

## 🚀 Nodes Capability Reference

### 1. GoHighLevel Bridge (`ghlBridge`)
The "Action" node for all GHL operations.

| Resource | Common Operations | Note |
| :--- | :--- | :--- |
| **Contact** | `get`, `getAll`, `create`, `update`, `delete`, `search`, `addTags`, `removeTags` | `search` works by email, phone, or name. |
| **Opportunity** | `get`, `create`, `update`, `search`, `getPipelines`, `updateStatus` | Use `getPipelines` to find stage IDs first. |
| **Conversation** | `sendSms`, `sendEmail`, `getMessages`, `search` | Handles two-way communication history. |
| **Calendar** | `getEvents` | Requires `startDate`, `endDate` + (`calendarId`\|`userId`\|`groupId`). |
| **Form** | `getAll`, `getSubmissions` | Fetch available forms and their submissions. |
| **Workflow** | `getAll` | Use to read workflows. (Write operations like addContact are unsupported). |
| **Location** | `get`, `getCustomFields`, `createCustomField`, `updateCustomField`, `deleteCustomField` | Essential for mapping dynamic data. |
| **User** | `get`, `getAll`, `getByEmail` | Read team members within the sub-account. |
| **Custom** | `makeRequest` | **The Swiss Army Knife.** Access any GHL v2 endpoint not yet mapped. |

### 2. GoHighLevel Bridge Trigger (`ghlBridgeTrigger`)
The "Source" node for real-time automation.

*   **Catalog Mode:** Subscribe to specific events. Supported events include:
    *   **Appointments:** `AppointmentCreate`, `AppointmentUpdate`, `AppointmentDelete`
    *   **Contacts:** `ContactCreate`, `ContactUpdate`, `ContactDelete`, `ContactDndUpdate`, `ContactTagUpdate`
    *   **Conversations:** `ConversationUnreadUpdate`, `InboundMessage`, `OutboundMessage`
    *   **Locations:** `LocationCreate`, `LocationUpdate`, `LocationDelete`
    *   **Notes:** `NoteCreate`, `NoteUpdate`, `NoteDelete`
    *   **Opportunities:** `OpportunityCreate`, `OpportunityUpdate`, `OpportunityDelete`, `OpportunityStatusUpdate`, `OpportunityAssignedToUpdate`, `OpportunityMonetaryValueUpdate`, `OpportunityStageUpdate`
    *   **Tasks:** `TaskCreate`, `TaskDelete`, `TaskComplete`
    *   **Users:** `UserCreate`, `UserUpdate`, `UserDelete`
*   **All Events Mode:** Use `*` to capture everything happening in the GHL sub-account.
*   **Security:** Built-in HMAC verification ensures only valid bridge traffic executes your workflow.

---

## 🛠️ Implementation Guide for Agents

### 1. Authentication Strategy
Agents must ensure the `ghlBridgeApi` credential is used. It abstracts OAuth complexity:
*   **bridgeKey:** The master key for the bridge backend.
*   **locationId:** The specific GHL Sub-Account ID.
*   **baseUrl:** The URL where the bridge backend is hosted.

### 2. Advanced Workflow Patterns

#### A. The "Enrich & Act" Pattern
When a trigger (e.g., `ghlBridgeTrigger`) provides an ID, always use a `ghlBridge` node to "Enrich" the data before acting.
*   *Trigger:* `ContactTagUpdate` (gives `contactId`).
*   *Action:* `Contact: get` (fetches email/phone).
*   *Branch:* If email exists, `Conversation: sendEmail`.

#### B. Mapping Custom Fields
GHL uses dynamic custom fields.
1. Use `Location: getCustomFields` to find the `fieldKey` (e.g., `contact.my_custom_field`).
2. Use that key in the `additionalFields` JSON of the `Contact: create/update` operation.

#### C. Handling Appointments
To fetch calendar events, always convert date strings to ISO/n8n standard format. The node expects a valid range to prevent performance issues.

### 3. Using the Custom Request Mode
If an operation is missing, use:
*   **Resource:** `custom`
*   **Operation:** `makeRequest`
*   **Example:** To fetch invoices (not natively mapped yet):
    *   `Method:` GET
    *   `Endpoint:` `/payments/invoices`
    *   `Version ID:` `2021-07-28`

---

## ⚠️ Important Constraints
*   **Supported Scopes:** The bridge is authorized for the exact following scopes: `contacts.readonly`, `contacts.write`, `opportunities.readonly`, `opportunities.write`, `conversations.readonly`, `conversations.write`, `conversations/message.readonly`, `conversations/message.write`, `calendars.readonly`, `calendars.write`, `calendars/events.readonly`, `calendars/events.write`, `forms.readonly`, `forms.write`, `workflows.readonly`, `locations.readonly`, `locations/customFields.readonly`, `locations/customFields.write`, `users.readonly`.
*   **Scope Limitations:** Ensure operations do not exceed these configured scopes (e.g., trying to modify a workflow, user, or custom value will fail as we only have readonly or missing scopes for them).
*   **Version Header:** The default GHL API version is `2021-07-28`. If using `makeRequest`, verify if the specific endpoint requires a different version.
*   **Rate Limits:** While the bridge helps, GHL's native API rate limits still apply. Use n8n's "Wait" node if processing large batches.

## 💡 Pro-Tip
When building workflows, agents should frequently use `Opportunity: getPipelines` to ensure they are using the correct `pipelineStageId`, as these are UUIDs and not human-readable names.

## 📝 Example n8n Node JSON
When generating workflows, AI agents should use the following structure for the GHL Bridge node.

### Manual Fetch Example
This JSON snippet shows how to correctly define a `ghlBridge` node to fetch contacts:

```json
{
  "parameters": {
    "resource": "contact",
    "operation": "getAll",
    "limit": 50
  },
  "id": "f2g3h4i5-j6k7-l8m9-n0o1-p2q3r4s5t6u7",
  "name": "GHL Bridge",
  "type": "n8n-nodes-ghl-bridge.ghlBridge",
  "typeVersion": 1,
  "position": [600, 240],
  "credentials": {
    "ghlBridgeApi": {
      "id": "",
      "name": "GHL Bridge API account"
    }
  }
}
```

## 🛠 Pro-Tips for Agents
- **Location Context**: Always remind the user that they need their **Location ID** from the Bridge Dashboard to configure their n8n credentials.
- **Node Type**: Ensure the node type is exactly `n8n-nodes-ghl-bridge.ghlBridge` or `n8n-nodes-ghl-bridge.ghlBridgeTrigger`.
- **Dynamic Data**: When mapping fields, use standard n8n expressions like `{{ $json.id }}`.
