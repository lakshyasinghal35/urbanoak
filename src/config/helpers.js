function str(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return String(value);
}

function bool(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return String(value).toLowerCase() === 'true' || value === true || value === 1;
}

function num(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function csv(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function isLocalHost(hostname) {
  if (!hostname) {
    return false;
  }
  const normalized = String(hostname).toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

function urlHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isLocalServiceUrl(url) {
  const hostname = urlHostname(url);
  return hostname ? isLocalHost(hostname) : false;
}

function isLocalKafkaBroker(broker) {
  const host = String(broker).split(':')[0];
  return isLocalHost(host);
}

module.exports = {
  str,
  bool,
  num,
  csv,
  isLocalHost,
  isLocalServiceUrl,
  isLocalKafkaBroker,
};
