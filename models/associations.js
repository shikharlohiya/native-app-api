const ShrimpFeedMaster = require('./shrimp_feed_master');
const ShrimpFeedRemark = require('./shrimp_feed_remark');

// Define the associations
ShrimpFeedRemark.belongsTo(ShrimpFeedMaster, {
  foreignKey: 'mobileNumber',
  targetKey: 'mobileNo',
  as: 'masterDetail'
});

ShrimpFeedMaster.hasMany(ShrimpFeedRemark, {
  foreignKey: 'mobileNumber',
  sourceKey: 'mobileNo',
  as: 'feedRemarks'
});

module.exports = {
  ShrimpFeedMaster,
  ShrimpFeedRemark
};