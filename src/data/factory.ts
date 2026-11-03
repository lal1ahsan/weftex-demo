import type { Operator, ShiftName, User } from '@/types'
import { IS_POLY, TERMS } from './dataset'

const WEAVING_FACTORY = {
  name: 'GH Weaving Mills',
  shortName: 'GH Weaving Factory',
  city: 'Faisalabad',
  address: 'Plot 42, Sahianwala Industrial Estate, Sheikhupura Road, Faisalabad',
  ntn: '4217893-6',
  strn: '32-77-8761-492-14',
  phone: '+92 41 8812 4450',
  email: 'info@ghweaving.com',
  established: 2009,
  halls: ['Hall A', 'Hall B', 'Hall C'],
  warehouses: ['Warehouse A', 'Warehouse B', 'Yarn Store 1', 'Yarn Store 2'],
  currency: 'PKR',
  timezone: 'Asia/Karachi (PKT, UTC+5)',
  fiscalYear: 'July – June',
  sanctionedLoadKw: 1150,
  solarCapacityKw: 600,
  fescoReference: '27 13112 1234500 U',
}

const POLY_FACTORY: typeof WEAVING_FACTORY = {
  name: 'Al-Noor Poly Pack',
  shortName: 'Al-Noor Poly Pack',
  city: 'Lahore',
  address: 'Plot 18, Sundar Industrial Estate, Raiwind Road, Lahore',
  ntn: '7781204-3',
  strn: '03-11-9876-221-55',
  phone: '+92 42 3529 7710',
  email: 'info@alnoorpolypack.com',
  established: 2014,
  halls: TERMS.areas,
  warehouses: ['Finished Goods Store', 'Bundle Store', 'Granules Store 1', 'Granules Store 2'],
  currency: 'PKR',
  timezone: 'Asia/Karachi (PKT, UTC+5)',
  fiscalYear: 'July – June',
  sanctionedLoadKw: 950,
  solarCapacityKw: 400,
  fescoReference: '24 11245 0987600 U',
}

export const FACTORY = IS_POLY ? POLY_FACTORY : WEAVING_FACTORY

export const FACTORIES = IS_POLY
  ? [{ id: 'anp-lhr', name: 'Al-Noor Poly Pack', city: 'Lahore', looms: 52 }]
  : [
      { id: 'ghw-fsd', name: 'GH Weaving Factory', city: 'Faisalabad', looms: 80 },
      { id: 'ghw-krw', name: 'GH Weaving Unit 2', city: 'Khurrianwala', looms: 48 },
    ]

export const SHIFTS: {
  name: ShiftName
  code: string
  start: string
  end: string
  supervisor: string
  operators: number
  color: string
}[] = [
  { name: 'Morning', code: 'A', start: '07:00', end: '15:00', supervisor: 'Muhammad Tariq', operators: 27, color: '#2c47cc' },
  { name: 'Evening', code: 'B', start: '15:00', end: '23:00', supervisor: 'Zahid Mehmood', operators: 27, color: '#0ea5a4' },
  { name: 'Night', code: 'C', start: '23:00', end: '07:00', supervisor: 'Abdul Rehman', operators: 26, color: '#8b7cf6' },
]

const OPERATOR_NAMES = [
  'Muhammad Imran', 'Ali Raza', 'Waqas Ahmed', 'Bilal Hussain', 'Shahid Iqbal', 'Naveed Akhtar',
  'Usman Ghani', 'Asif Mehmood', 'Rizwan Ali', 'Kashif Javed', 'Tariq Mahmood', 'Sajid Ali',
  'Faisal Nadeem', 'Imtiaz Ahmed', 'Zeeshan Haider', 'Adnan Saleem', 'Khurram Shahzad', 'Arshad Iqbal',
  'Nadeem Abbas', 'Shakeel Ahmed', 'Jamil Akhtar', 'Amjad Pervaiz', 'Sohail Anwar', 'Mudassar Ali',
  'Irfan Ullah', 'Haroon Rashid', 'Qaiser Abbas', 'Javed Iqbal', 'Ghulam Mustafa', 'Babar Ali',
  'Rashid Mehmood', 'Mubashir Hassan', 'Atif Aslam', 'Yasir Arafat', 'Nasir Khan', 'Sarfraz Ahmed',
  'Ehsan Ullah', 'Waseem Akram', 'Tahir Abbas', 'Saqib Mehmood', 'Abid Hussain', 'Shafqat Ali',
  'Mazhar Iqbal', 'Liaqat Ali', 'Zafar Iqbal', 'Azhar Mehmood', 'Riaz Ahmed', 'Mumtaz Hussain',
  'Akram Shah', 'Danish Ali', 'Fahad Mustafa', 'Hamza Ali', 'Noman Ijaz', 'Asim Raza',
  'Kamran Akmal', 'Shoaib Akhtar', 'Umar Farooq', 'Aamir Sohail', 'Junaid Khan', 'Taimoor Ali',
  'Ijaz Ahmed', 'Mohsin Raza', 'Iftikhar Ahmed', 'Rafaqat Ali', 'Sabir Hussain', 'Anwar Ali',
  'Akhtar Ali', 'Manzoor Ahmed', 'Shahzad Akbar', 'Parvez Iqbal', 'Wajid Ali', 'Talha Mehmood',
  'Saleem Raza', 'Ahsan Ali', 'Zubair Ahmed', 'Arif Hussain', 'Ghulam Abbas', 'Mushtaq Ahmed',
  'Raheel Shah', 'Owais Qarni',
]

export const OPERATORS: Operator[] = OPERATOR_NAMES.map((name, i) => ({
  id: `OP-${String(101 + i)}`,
  name,
  shift: (['Morning', 'Evening', 'Night'] as const)[i % 3],
}))

const WEAVING_USERS: User[] = [
  { id: 'U-01', name: 'Ahmed Hassan', email: 'ahmed@ghweaving.com', role: 'Owner', phone: '0300 8654 221', lastActive: 'Just now', status: 'Active' },
  { id: 'U-02', name: 'Hamid Raza', email: 'hamid@ghweaving.com', role: 'Admin', phone: '0321 6612 908', lastActive: '12 min ago', status: 'Active' },
  { id: 'U-03', name: 'Kamran Saeed', email: 'kamran@ghweaving.com', role: 'Production Manager', phone: '0333 7781 452', lastActive: '4 min ago', status: 'Active' },
  { id: 'U-04', name: 'Muhammad Tariq', email: 'tariq@ghweaving.com', role: 'Supervisor', phone: '0345 2230 119', lastActive: '1 min ago', status: 'Active' },
  { id: 'U-05', name: 'Zahid Mehmood', email: 'zahid@ghweaving.com', role: 'Supervisor', phone: '0301 4456 870', lastActive: 'Yesterday', status: 'Active' },
  { id: 'U-06', name: 'Abdul Rehman', email: 'rehman@ghweaving.com', role: 'Supervisor', phone: '0312 9087 334', lastActive: '6 hours ago', status: 'Active' },
  { id: 'U-07', name: 'Naeem Akhtar', email: 'naeem@ghweaving.com', role: 'Store Manager', phone: '0300 1123 567', lastActive: '25 min ago', status: 'Active' },
  { id: 'U-08', name: 'Sana Iqbal', email: 'sana@ghweaving.com', role: 'Accountant', phone: '0322 5543 210', lastActive: '40 min ago', status: 'Active' },
  { id: 'U-09', name: 'Farhan Ali', email: 'farhan@ghweaving.com', role: 'Sales', phone: '0333 6678 901', lastActive: '2 hours ago', status: 'Active' },
  { id: 'U-10', name: 'Rabia Anwar', email: 'rabia@ghweaving.com', role: 'Quality Inspector', phone: '0300 9981 112', lastActive: '18 min ago', status: 'Active' },
  { id: 'U-11', name: 'Usman Tariq', email: 'usman.t@ghweaving.com', role: 'Supervisor', phone: '0315 3349 778', lastActive: '—', status: 'Invited' },
  { id: 'U-12', name: 'Imran Qureshi', email: 'imran.q@ghweaving.com', role: 'Sales', phone: '0302 7712 004', lastActive: '3 months ago', status: 'Disabled' },
]

const POLY_USERS: User[] = [
  { id: 'P-01', name: 'Bilal Ahmed', email: 'demo@alnoorpolypack.com', role: 'Owner', phone: '0300 4412 873', lastActive: 'Just now', status: 'Active' },
  { id: 'P-02', name: 'Shahid Mehmood', email: 'shahid@alnoorpolypack.com', role: 'TM', phone: '0333 4127 790', lastActive: '6 min ago', status: 'Active' },
  { id: 'P-03', name: 'Javed Iqbal', email: 'javed@alnoorpolypack.com', role: 'Mechanics', phone: '0345 8810 234', lastActive: '20 min ago', status: 'Active' },
  { id: 'P-04', name: 'Arif Hussain', email: 'arif@alnoorpolypack.com', role: 'Store Manager', phone: '0301 7765 123', lastActive: '15 min ago', status: 'Active' },
  { id: 'P-05', name: 'Nadeem Abbas', email: 'nadeem@alnoorpolypack.com', role: 'Finished Goods Manager', phone: '0321 9934 410', lastActive: '1 hour ago', status: 'Active' },
  { id: 'P-06', name: 'Ayesha Khan', email: 'ayesha@alnoorpolypack.com', role: 'Accountant', phone: '0322 4419 087', lastActive: '35 min ago', status: 'Active' },
  { id: 'P-07', name: 'Usman Ghani', email: 'usman@alnoorpolypack.com', role: 'Supervisor', phone: '0312 5501 276', lastActive: '2 hours ago', status: 'Active' },
  { id: 'P-08', name: 'Sher Khan', email: 'sher@alnoorpolypack.com', role: 'Security Guard', phone: '0315 2298 441', lastActive: '—', status: 'Invited' },
]

export const USERS: User[] = IS_POLY ? POLY_USERS : WEAVING_USERS

export const INSPECTORS = IS_POLY ? ['Nadeem Abbas', 'Saima Riaz', 'Tahir Javed'] : ['Rabia Anwar', 'Kashif Mahmood', 'Shazia Parveen']
