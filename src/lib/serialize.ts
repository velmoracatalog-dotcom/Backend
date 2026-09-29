type WithId = { _id: { toString(): string }; toObject?: () => Record<string, unknown> };

export function serialize<T extends WithId>(doc: T) {
  const raw = (doc.toObject?.() ?? doc) as Record<string, unknown>;
  const { _id, __v, ...rest } = raw;
  return {
    id: String(_id),
    ...rest,
  };
}

export function serializeProduct(doc: WithId & { slug?: string }) {
  const item = serialize(doc);
  return {
    ...item,
    slug: doc.slug ?? item.id,
  };
}

export function publicUser(doc: WithId) {
  const item = serialize(doc) as {
    id: string;
    email: string;
    name: string;
    picture?: string;
    role: "user" | "admin";
  };
  return {
    id: item.id,
    email: item.email,
    name: item.name,
    picture: item.picture,
    role: item.role,
  };
}
