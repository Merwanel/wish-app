import { z } from "zod";
import { uint8ArrayToBase64 } from "uint8array-extras";

export const Base64 = z.string().regex(/^[A-Za-z0-9+/=]*$/, "Invalid base64");
export type Base64 = z.infer<typeof Base64>;

export const TagDomain = z.object({
  id: z.string().uuid(),
  value: z.string().min(1),
});
export type TagDomain = z.infer<typeof TagDomain>;

export const WishDomain = z.object({
  id: z.number().int(),
  createdAt: z.string().datetime(),
  name: z.string().min(1),
  comment: z.string(),
  tags: z.array(TagDomain),
  picture: z.instanceof(Uint8Array),
});
export type WishDomain = z.infer<typeof WishDomain>;

export const WishDTO = z.object({
  id: z.number().int(),
  createdAt: z.string().datetime(),
  name: z.string().min(1),
  comment: z.string(),
  tags: z.array(z.string().min(1)),
  picture: Base64,
});
export type WishDTO = z.infer<typeof WishDTO>;

export const WishPatchDTO = WishDTO.partial();
export type WishPatchDTO = z.infer<typeof WishPatchDTO>;

export const WishDomainBase = z.object({
  id: z.number().int(),
  createdAt: z.string().datetime(),
  name: z.string(),
  comment: z.string(),
  tags: z.array(z.string()),
  picture: z.instanceof(Uint8Array),
});
export type WishDomainBase = z.infer<typeof WishDomainBase>;
export const WishDomainPartial = WishDomainBase.partial();
export type WishDomainPartial = z.infer<typeof WishDomainPartial>;

export function toPatchDTO(partial: WishDomainPartial): WishPatchDTO {
  const out: any = { ...partial };
  if (partial.picture instanceof Uint8Array) {
    out.picture = uint8ArrayToBase64(partial.picture);
  }
  return WishPatchDTO.parse(out);
}
