const pages = [
  'pages/home/index',
  'pages/record/index',
  'pages/create-mainline/index',
  'pages/node-detail/index',
  'pages/diary/index',
  'pages/habits/index',
  'pages/stats/index',
  'pages/profile/index',
  'pages/timer/index',
  'pages/templates/index',
]

//  To fully leverage TypeScript's type safety and ensure its correctness, always enclose the configuration object within the global defineAppConfig helper function.
export default defineAppConfig({
  pages,
  tabBar: {
    color: '#8A8578',
    selectedColor: '#2F4F3F',
    backgroundColor: '#FDFBF7',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '地图',
        iconPath: './assets/icons/map_unselected.png',
        selectedIconPath: './assets/icons/map_selected.png',
      },
      {
        pagePath: 'pages/habits/index',
        text: '习惯',
        iconPath: './assets/icons/footprint_unselected.png',
        selectedIconPath: './assets/icons/footprint_selected.png',
      },
      {
        pagePath: 'pages/stats/index',
        text: '看板',
        iconPath: './assets/icons/board_unselected.png',
        selectedIconPath: './assets/icons/board_selected.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/icons/profile_unselected.png',
        selectedIconPath: './assets/icons/profile_selected.png',
      },
    ]
  },
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#FDFBF7',
    navigationBarTitleText: 'YORO',
    navigationBarTextStyle: 'black'
  },
  // Location APIs: Use 'getFuzzyLocation' for fuzzy location (cannot combine with precise APIs),
  // or use precise APIs: 'getLocation', 'onLocationChange', 'startLocationUpdate', 'chooseLocation', 'choosePoi', 'chooseAddress'
  // Background location: 'startLocationUpdateBackground'. Other values are strictly prohibited.
  // requiredPrivateInfos: []
})
