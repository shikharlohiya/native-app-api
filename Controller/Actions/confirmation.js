const express = require('express');
const router = express.Router();
const Lead_Detail = require('../../models/lead_detail');
const site_visit = require('../../models/site_visit');
const estimation = require('../../models/estimation');
const lead_Meeting = require('../../models/lead_meeting');
const LeadUpdate = require('../../models/lead_update');
const { Op } = require('sequelize');

exports.getLatestLeadData = async (req, res) => {
  try {
    const { leadId } = req.params;

    const leadDetail = await Lead_Detail.findByPk(leadId);

    if (!leadDetail) {
      return res.status(404).json({ error: 'Lead detail not found' });
    }

    const latestData = await Lead_Detail.findOne({
      where: { id: leadId },
      attributes: ['id'],
      include: [
        {
          model: site_visit,
          as: 'site_visits',
          attributes: ['category', 'sub_category', 'follow_up_date', 'createdAt'],
          required: false,
        },
        {
          model: estimation,
          as: 'estimations',
          attributes: ['category', 'sub_category', 'follow_up_date', 'createdAt'],
          required: false,
        },
        {
          model: lead_Meeting,
          as: 'meetings',
          attributes: ['category', 'sub_category', 'follow_up_date', 'createdAt'],
          required: false,
        },
        {
          model: LeadUpdate,
          as: 'updates',
          attributes: ['category', 'sub_category', 'follow_up_date', 'createdAt'],
          required: false,
        },
      ],
      order: [
        [{ model: site_visit, as: 'site_visits' }, 'createdAt', 'DESC'],
        [{ model: estimation, as: 'estimations' }, 'createdAt', 'DESC'],
        [{ model: lead_Meeting, as: 'meetings' }, 'createdAt', 'DESC'],
        [{ model: LeadUpdate, as: 'updates' }, 'createdAt', 'DESC'],
      ],
      limit: 1,
    });

    const latestAction = latestData.site_visits[0] || latestData.estimations[0] || latestData.meetings[0] || latestData.updates[0] || null;

    res.status(200).json({
      leadDetail,
      latestAction,
    });
  } catch (error) {
    console.error('Error retrieving latest lead data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};