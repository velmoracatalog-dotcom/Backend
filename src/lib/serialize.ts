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
    id: doc.slug ?? item.id,
  };
}
