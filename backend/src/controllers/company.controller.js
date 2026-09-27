import Company from '../models/Company.js'
import AppError from '../utils/AppError.js'
import { sendSuccess } from '../utils/response.js'

// Fields a recruiter may set; recruiter ownership always comes from req.user
const EDITABLE_FIELDS = ['name', 'description', 'website', 'location', 'logo']

function pickCompanyFields(body = {}) {
  const data = {}
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field]
  }
  return data
}

// POST /api/companies
export async function createCompany(req, res) {
  if (await Company.exists({ recruiter: req.user._id })) {
    throw new AppError('You already have a company profile. Update it instead.', 409)
  }

  // A concurrent duplicate still fails on the unique recruiter index (handled as 409)
  const company = await Company.create({ ...pickCompanyFields(req.body), recruiter: req.user._id })

  sendSuccess(res, 201, 'Company profile created', company)
}

// GET /api/companies/my-company
export async function getMyCompany(req, res) {
  const company = await Company.findOne({ recruiter: req.user._id })
  if (!company) {
    throw new AppError('You have not created a company profile yet', 404)
  }
  sendSuccess(res, 200, 'Company fetched', company)
}

// GET /api/companies/:id
export async function getCompanyById(req, res) {
  const company = await Company.findById(req.params.id)
  if (!company) {
    throw new AppError('Company not found', 404)
  }
  sendSuccess(res, 200, 'Company fetched', company)
}

// PUT /api/companies/:id
export async function updateCompany(req, res) {
  const company = await Company.findById(req.params.id)
  if (!company) {
    throw new AppError('Company not found', 404)
  }
  if (!company.recruiter.equals(req.user._id)) {
    throw new AppError('You can only update your own company profile', 403)
  }

  const updates = pickCompanyFields(req.body)
  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields provided to update', 400)
  }

  company.set(updates)
  await company.save()

  sendSuccess(res, 200, 'Company profile updated', company)
}
