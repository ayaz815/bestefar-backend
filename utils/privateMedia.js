const AWS = require("aws-sdk");

// Private media (access-control Module 4d). Shows store plain S3 links to their
// music/audio/image files. Once ACCESS_ENFORCE=true, every link to one of those
// files is swapped for a signed link valid for 12 hours before it leaves the
// server, so the files can be made private in S3. When the generator saves a
// show, signatures are stripped again so a show never stores an expiring link.

const MEDIA_FOLDERS = ["musicFiles/", "audioFiles/", "imageFiles/"];
const SIGNED_HOURS = 12;

const bucketHost = () => `${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

// Returns the S3 key for a link to one of our media files, or null.
const mediaKey = (value) => {
  if (typeof value !== "string" || !value.startsWith("https://")) return null;
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.host !== bucketHost()) return null;
  const key = decodeURIComponent(url.pathname.slice(1));
  return MEDIA_FOLDERS.some((folder) => key.startsWith(folder)) ? key : null;
};

let s3;
const defaultSigner = (key) => {
  s3 ||= new AWS.S3({ region: process.env.AWS_REGION, signatureVersion: "v4" });
  return s3.getSignedUrl("getObject", { Bucket: process.env.AWS_BUCKET_NAME, Key: key, Expires: SIGNED_HOURS * 3600 });
};

// Walks any JSON-like value and replaces matching strings; everything else is copied as is.
const mapStrings = (value, fn) => {
  if (typeof value === "string") return fn(value);
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn));
  if (value && typeof value === "object" && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn)]));
  }
  return value;
};

const signMediaUrls = (data, signer = defaultSigner) =>
  mapStrings(data, (s) => {
    const key = mediaKey(s.split("?")[0]);
    return key ? signer(key) : s;
  });

const stripMediaSignatures = (data) =>
  mapStrings(data, (s) => (mediaKey(s.split("?")[0]) ? s.split("?")[0] : s));

// Route middleware: sign media links in what this route sends (switch on only).
const signMediaInResponse = (req, res, next) => {
  if (process.env.ACCESS_ENFORCE !== "true") return next();
  const json = res.json.bind(res);
  res.json = (body) => json(signMediaUrls(JSON.parse(JSON.stringify(body))));
  next();
};

// Route middleware: never store a signed link (put it after body parsing/multer).
const stripMediaInBody = (req, res, next) => {
  if (req.body && typeof req.body === "object") req.body = stripMediaSignatures(req.body);
  next();
};

module.exports = { mediaKey, signMediaUrls, stripMediaSignatures, signMediaInResponse, stripMediaInBody, SIGNED_HOURS };
