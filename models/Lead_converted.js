const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class Lead_converted extends Model {}

Lead_converted.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    LeadDetailId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "lead_detail",
        key: "id",
      },
    },
    payment_amount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payment_slip: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    customer_creation_form: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    pan_card: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    aadhar_card: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    land_certificate: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    gst_certificate: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    bank_account_details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    bank_cheques: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    legal_agreement_copy: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    affidavit_property: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    consent_letter_dispatch: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    consent_letter_third_party_payment: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    estimation: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    final_quotation: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    annexure: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    udyam_registration_certificate: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    gram_panchayat_noc: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    remark: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    extra_field2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    extra_field3: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    extra_field4: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "LeadConverted",
    tableName: "Lead_converted",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Lead_converted;
