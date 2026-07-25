import { StyleSheet } from 'react-native'

import { tavernColors } from '../ui/tavern'
import { theme } from '../ui/theme'

/** Wheel row height, shared by the wheel styles and the scroll snapping logic. */
export const WHEEL_ITEM_H = 34

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  step: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(3),
  },
  logoText: {
    ...theme.type.title,
    color: tavernColors.gold,
    letterSpacing: 3,
    textAlign: 'center',
  },
  dialogWell: { padding: theme.spacing(1.5) },
  dialogText: {
    ...theme.type.label,
    fontSize: 10,
    lineHeight: 16,
    color: tavernColors.inkOnParchment,
    textAlign: 'center',
  },
  choices: {
    alignSelf: 'stretch',
    gap: theme.spacing(3),
  },
  windowInset: {
    alignSelf: 'stretch',
    backgroundColor: '#180e07',
    borderWidth: 2,
    borderColor: tavernColors.edge,
    paddingVertical: theme.spacing(3),
    alignItems: 'center',
  },
  windowInsetText: {
    fontFamily: theme.fontFamily,
    fontSize: 12,
    letterSpacing: 1,
    color: tavernColors.gold,
  },
  rulesWell: { padding: theme.spacing(1.5) },
  rules: { gap: theme.spacing(2.5) },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(3),
  },
  ruleIcon: { width: 30, alignItems: 'center' },
  ruleText: {
    ...theme.type.label,
    fontSize: 9,
    lineHeight: 15,
    color: tavernColors.inkOnParchment,
    flex: 1,
  },
  wheels: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: theme.spacing(3),
  },
  wheelColumn: {
    flex: 1,
    gap: theme.spacing(1.5),
  },
  wheelPlaque: {
    alignSelf: 'center',
    backgroundColor: tavernColors.gold,
    borderTopWidth: 2,
    borderTopColor: tavernColors.goldLight,
    borderBottomWidth: 2,
    borderBottomColor: tavernColors.goldEdge,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(1.5),
  },
  wheelPlaqueText: {
    fontFamily: theme.fontFamily,
    fontSize: 9,
    letterSpacing: 1,
    color: tavernColors.inkOnParchment,
  },
  wheelFrame: {
    backgroundColor: tavernColors.edge,
    borderWidth: 2,
    borderColor: tavernColors.edge,
    borderTopColor: tavernColors.light,
    padding: theme.spacing(1.5),
  },
  wheelWell: {
    height: WHEEL_ITEM_H * 5,
    overflow: 'hidden',
    backgroundColor: '#180e07',
  },
  wheelHighlight: {
    position: 'absolute',
    top: WHEEL_ITEM_H * 2,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tavernColors.goldEdge,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(1.5),
    zIndex: 1,
  },
  chevron: {
    width: 7,
    height: 7,
    backgroundColor: tavernColors.gold,
    transform: [{ rotate: '45deg' }],
  },
  wheelItem: {
    height: WHEEL_ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    ...theme.type.body,
    color: theme.colors.textDim,
  },
  wheelTextSelected: {
    fontSize: 15,
    lineHeight: 20,
    color: tavernColors.gold,
  },
  disabled: { opacity: 0.45 },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  caption: {
    ...theme.type.label,
    color: theme.colors.textDim,
    letterSpacing: 2,
  },
  captionInvalid: { color: theme.colors.heartFull },
  captionDiamond: {
    width: 5,
    height: 5,
    backgroundColor: theme.colors.textDim,
    transform: [{ rotate: '45deg' }],
  },
})
