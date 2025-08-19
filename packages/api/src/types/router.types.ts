import type { RouterInputs, RouterOutputs } from "../index";

export type GetBoardByIdOutput = RouterOutputs["board"]["byId"];
export type GetCardByIdOutput = RouterOutputs["card"]["byId"];
export type UpdateBoardInput = RouterInputs["board"]["update"];
export type NewLabelInput = RouterInputs["label"]["create"];
export type NewListInput = RouterInputs["list"]["create"];
export type NewCardInput = RouterInputs["card"]["create"];
export type NewBoardInput = RouterInputs["board"]["create"];
export type InviteMemberInput = RouterInputs["member"]["invite"];

// Card image-related types
export type AddImageToCardInput = RouterInputs["card"]["addImage"];
export type RemoveImageFromCardInput = RouterInputs["card"]["removeImage"];
export type ReplaceImageOnCardInput = RouterInputs["card"]["replaceImage"];

// Image-related types
export type ImageUploadInput = RouterInputs["image"]["upload"];
export type ImageUploadOutput = RouterOutputs["image"]["upload"];
export type ImageDeleteInput = RouterInputs["image"]["delete"];
export type GetImagesByCardOutput = RouterOutputs["image"]["getByCard"];

// Re-export cardImage types for convenience
export * from "./cardImage.types";