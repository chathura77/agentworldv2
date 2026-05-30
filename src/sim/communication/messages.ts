export type CommunicationMessageType =
  | "askInventory"
  | "proposeShare"
  | "acceptShare"
  | "rejectShare"
  | "requestPartnership"
  | "acceptPartnership"
  | "rejectPartnership"
  | "joinGroup"
  | "leaveGroup";

export interface CommunicationMessage {
  id: string;
  tick: number;
  fromCreatureId: string;
  toCreatureId: string;
  type: CommunicationMessageType;
  payload?: Record<string, string | number | boolean | null>;
}

