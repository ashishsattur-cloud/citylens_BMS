import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import Report from '../models/Report.js';
import StatusHistory from '../models/StatusHistory.js';
import { calculateSeverity } from '../services/severity.js';

const samples = [
  { referenceId:'CL-1042', title:'Collapsed slab over storm drain', category:'footpath', status:'reported', description:'Two footpath slabs have caved in over the drain outside the bus stop. Commuters are stepping onto the road to get around it, especially during evening rush hour.', locality:'Indiranagar', address:'100 Feet Rd, near HAL 2nd Stage bus stop', lat:12.9719, lng:77.6412, reportedAt:'2026-10-28', updatedAt:'2026-10-28', ward:'Ward 80 · Hoysala Nagar', reporterName:'Ananya R.', photo:'issue-footpath.jpg', impactLevel:'high', peopleAffected:200, criticalLocation:'transit' },
  { referenceId:'CL-1039', title:'Debris and bikes block entire footpath', category:'blocked', status:'in_progress', description:'Construction debris has been dumped on the footpath for three weeks. Two-wheelers park on the remaining strip. Pedestrians, including school children, walk on the carriageway.', locality:'Koramangala', address:'80 Feet Rd, 4th Block', lat:12.9352, lng:77.6245, reportedAt:'2026-10-21', updatedAt:'2026-10-30', ward:'Ward 151 · Koramangala', reporterName:'Mohammed S.', photo:'issue-blocked.jpg', impactLevel:'high', peopleAffected:300, criticalLocation:'school' },
  { referenceId:'CL-1036', title:'Deep pothole at junction turn', category:'pothole', status:'reported', description:'Water-logged pothole roughly 1.5 m wide right at the left turn. Two-wheelers swerve towards the kerb where people are waiting to cross.', locality:'Jayanagar', address:'11th Main & 30th Cross, 4th Block', lat:12.925, lng:77.5838, reportedAt:'2026-10-19', updatedAt:'2026-10-19', ward:'Ward 169 · Jayanagar East', reporterName:'Kavya N.', photo:'issue-pothole.jpg', impactLevel:'critical', peopleAffected:150, criticalLocation:'market' },
  { referenceId:'CL-1031', title:'No pedestrian signal at six-lane crossing', category:'crossing', status:'in_progress', description:'The zebra crossing has faded and the pedestrian signal has been off since August. Elderly residents wait several minutes for a gap in traffic.', locality:'Malleshwaram', address:'Sampige Rd at 8th Cross', lat:13.0035, lng:77.5709, reportedAt:'2026-10-12', updatedAt:'2026-10-26', ward:'Ward 45 · Malleshwaram', reporterName:'Raghav K.', photo:'issue-footpath.jpg', impactLevel:'high', peopleAffected:500, criticalLocation:'transit' },
  { referenceId:'CL-1027', title:'Kerb ramp missing at metro exit', category:'accessibility', status:'resolved', description:'Exit B has a 30 cm kerb with no ramp. Wheelchair users and people with prams cannot reach the footpath. A ramp was added on 24 Oct.', locality:'MG Road', address:'MG Road Metro, Exit B', lat:12.9755, lng:77.6068, reportedAt:'2026-09-30', updatedAt:'2026-10-24', ward:'Ward 111 · Shantala Nagar', reporterName:'Priya D.', photo:'issue-blocked.jpg', impactLevel:'moderate', peopleAffected:90, criticalLocation:'transit' },
  { referenceId:'CL-1024', title:'Broken tiles along hospital stretch', category:'footpath', status:'resolved', description:'Loose interlocking tiles along a 200 m stretch near the hospital gate. Relaid by the contractor after ward engineer inspection.', locality:'Basavanagudi', address:'Bull Temple Rd, near Gandhi Bazaar', lat:12.9421, lng:77.5737, reportedAt:'2026-09-22', updatedAt:'2026-10-15', ward:'Ward 154 · Basavanagudi', reporterName:'Suresh B.', photo:'issue-footpath.jpg', impactLevel:'moderate', peopleAffected:100, criticalLocation:'hospital' },
  { referenceId:'CL-1019', title:'Vendor carts occupy footpath at signal', category:'blocked', status:'reported', description:'The full width of the footpath is taken up near the signal between 5 and 10 pm. Pedestrians walk in the bus lane.', locality:'HSR Layout', address:'27th Main, Sector 1', lat:12.9116, lng:77.6473, reportedAt:'2026-10-30', updatedAt:'2026-10-30', ward:'Ward 174 · HSR Layout', reporterName:'Neha G.', photo:'issue-blocked.jpg', impactLevel:'moderate', peopleAffected:70, criticalLocation:'market' },
  { referenceId:'CL-1015', title:'Open manhole beside school gate', category:'pothole', status:'in_progress', description:'Manhole cover missing next to the school entrance, partially covered with a plank. Extremely dangerous at drop-off time.', locality:'Whitefield', address:'ITPL Main Rd, near Hope Farm', lat:12.9698, lng:77.75, reportedAt:'2026-10-25', updatedAt:'2026-10-31', ward:'Ward 84 · Hagadur', reporterName:'Arjun M.', photo:'issue-pothole.jpg', impactLevel:'critical', peopleAffected:250, criticalLocation:'school' },
  { referenceId:'CL-1011', title:'Footpath ends abruptly at flyover', category:'accessibility', status:'reported', description:'The footpath stops at the flyover ramp with a 50 cm drop and no continuation. Pedestrians walk inside the flyover lane.', locality:'Hebbal', address:'Bellary Rd service road', lat:13.0358, lng:77.597, reportedAt:'2026-10-17', updatedAt:'2026-10-17', ward:'Ward 19 · Ganganagar', reporterName:'Lakshmi P.', photo:'issue-footpath.jpg', impactLevel:'high', peopleAffected:100, criticalLocation:'transit' },
  { referenceId:'CL-1008', title:'Faded zebra crossing near market', category:'crossing', status:'resolved', description:'Crossing markings were barely visible. Repainted with reflective paint and a speed table added.', locality:'Rajajinagar', address:'Dr Rajkumar Rd, 2nd Block', lat:12.9915, lng:77.5525, reportedAt:'2026-09-10', updatedAt:'2026-10-02', ward:'Ward 99 · Rajajinagar', reporterName:'Vinay H.', photo:'issue-pothole.jpg', impactLevel:'moderate', peopleAffected:80, criticalLocation:'market' }
];

try {
  await connectDatabase();
  await Report.createIndexes();
  for (const item of samples) {
    const createdAt = new Date(`${item.reportedAt || '2026-10-25'}T08:00:00.000Z`);
    const updatedAt = new Date(`${item.updatedAt || item.reportedAt || '2026-10-25'}T08:00:00.000Z`);
    const doc = await Report.findOneAndUpdate({ referenceId: item.referenceId }, {
      $setOnInsert: {
        referenceId: item.referenceId, title: item.title, description: item.description, category: item.category, status: item.status,
        location: { type: 'Point', coordinates: [item.lng, item.lat], address: item.address, locality: item.locality, ward: item.ward },
        photos: [{ url: `/uploads/${item.photo}`, publicId: '' }], reporterName: item.reporterName, impactLevel: item.impactLevel,
        peopleAffected: item.peopleAffected, criticalLocation: item.criticalLocation, createdAt, updatedAt
      }
    }, { upsert: true, new: true, setDefaultsOnInsert: true, timestamps: false });
    const nearby = await Report.countDocuments({ _id: { $ne: doc._id }, createdAt: { $gte: new Date(Date.now() - 30 * 86400000) }, location: { $geoWithin: { $centerSphere: [doc.location.coordinates, 500 / 6378100] } } });
    const severity = calculateSeverity(doc, nearby);
    await Report.updateOne({ _id: doc._id }, { $set: { severity } }, { timestamps: false });
    if (!(await StatusHistory.exists({ report: doc._id }))) {
      await StatusHistory.create({ report: doc._id, previousStatus: 'new', newStatus: 'reported', remarks: 'Sample community report submitted.', createdAt });
      if (item.status !== 'reported') await StatusHistory.create({ report: doc._id, previousStatus: 'reported', newStatus: item.status, remarks: 'Sample status update for demonstration.', createdAt: updatedAt });
    }
  }
  console.log(`Seeded/verified ${samples.length} Bengaluru demo reports. Existing reports with these IDs were not overwritten.`);
} catch (e) { console.error(e); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
