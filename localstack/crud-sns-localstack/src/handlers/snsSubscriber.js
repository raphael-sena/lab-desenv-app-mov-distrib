module.exports.handler = async (event) => {
  // SNS delivers records in this format:
  // event.Records[].Sns.Message (string)
  const records = event?.Records || [];
  for (const r of records) {
    const sns = r.Sns || {};
    console.log("SNS SUBJECT:", sns.Subject);
    console.log("SNS MESSAGE:", sns.Message);
  }
  return { ok: true, received: records.length };
};
