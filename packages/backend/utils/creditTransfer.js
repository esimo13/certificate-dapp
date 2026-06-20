export function calculateTransferredUnits(sourceCourseCredits, sourceAnnualLoad, targetAnnualLoad) {
  const credits = Number(sourceCourseCredits);
  const sourceLoad = Number(sourceAnnualLoad);
  const targetLoad = Number(targetAnnualLoad);

  if (!Number.isFinite(credits) || !Number.isFinite(sourceLoad) || !Number.isFinite(targetLoad)) {
    throw new Error('Credit transfer inputs must be numeric');
  }

  if (sourceLoad <= 0 || targetLoad <= 0) {
    throw new Error('Annual load must be greater than zero');
  }

  return (credits / sourceLoad) * targetLoad;
}

export function roundUnits(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
