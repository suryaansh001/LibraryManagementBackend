export function tenantScope(req, res, next) {
  if (req.user && req.user.libraryId) {
    req.libraryId = req.user.libraryId;
  }
  next();
}
