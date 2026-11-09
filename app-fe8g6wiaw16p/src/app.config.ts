const pages = [
  'pages/home/index',
  'pages/record/index',
  'pages/create-mainline/index',
  'pages/node-detail/index',
  'pages/diary/index',
  'pages/habits/index',
  'pages/stats/index',
  'pages/profile/index',
  'pages/templates/index',
]

//  To fully leverage TypeScript's type safety and ensure its correctness, always enclose the configuration object within the global defineAppConfig helper function.
export default defineAppConfig({
  pages,
  tabBar: {
    color: '#9AA7B8',
    selectedColor: '#3B6FB0',
    backgroundColor: '#EAF3FF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '地图',
        iconPath: './assets/icons/map_unselected.png',
        selectedIconPath: './assets/icons/map_selected.png',
      },
      {
        pagePath: 'pages/diary/index',
        text: '回声',
        iconPath: './assets/icons/echo_unselected.png',
        selectedIconPath: './assets/icons/echo_selected.png',
      },
      {
        pagePath: 'pages/habits/index',
        text: '习惯',
        iconPath: './assets/icons/habits_unselected.png',
        selectedIconPath: './assets/icons/habits_selected.png',
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
    navigationBarBackgroundColor: '#EAF3FF',
    navigationBarTitleText: 'YORO',
    navigationBarTextStyle: 'black'
  },
  // Location APIs: Use 'getFuzzyLocation' for fuzzy location (cannot combine with precise APIs),
  // or use precise APIs: 'getLocation', 'onLocationChange', 'startLocationUpdate', 'chooseLocation', 'choosePoi', 'chooseAddress'
  // Background location: 'startLocationUpdateBackground'. Other values are strictly prohibited.
  // requiredPrivateInfos: []
})
