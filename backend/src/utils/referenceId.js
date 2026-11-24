export async function nextReferenceId(Report) {
  const ids = await Report.find({ referenceId: /^CL-/ }).select('referenceId').lean();
  const max = ids.reduce((value, item) => Math.max(value, Number(item.referenceId.split('-')[1]) || 0), 0);
  return `CL-${max + 1}`;
}
export const isValidObjectId = (id) => /^[a-f0-9]{24}$/i.test(String(id));
