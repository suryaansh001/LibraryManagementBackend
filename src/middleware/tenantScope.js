export function tenantScope(req, res, next) { console.log('tenantScope: req.user=', req.user);
  if (req.user && req.user.libraryId) {
    req.libraryId = req.user.libraryId;
  }
  next();
}
