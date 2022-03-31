module.exports = (...permittedRoles) => {
  return (req, res, next) => {
    const role = req.userData.role.toLowerCase();
    if ((role && permittedRoles.map((e) => e.toLowerCase()).includes(role)) || permittedRoles.some((e) => e === "all")) {
      next();
    } else {
      res.status(401).json({ message: "Forbidden" });
    }
  };
};
