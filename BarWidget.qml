import QtQuick
import qs.Commons
import qs.Ui

BarWidget {
  id: root
  moduleName: "io.github.canclini.calculator"

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  BarIconButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: "󰃬"
    slotSize: Style.bar.statusSlot
    tooltipText: "Calculator"

    onPressed: function(b) {
      if (!root.bar || !root.bar.shell) return
      root.bar.shell.toggle(root.moduleName, "{}")
    }
  }
}
