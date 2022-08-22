// Initialize butotn with users's prefered color
let fetchOrderButton = document.getElementById("fetchOrder");
let itemDiv = document.getElementById("items")

chrome.storage.sync.get("color", ({ color }) => {
  fetchOrderButton.style.backgroundColor = color;
});


fetchOrderButton.addEventListener("click", async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //Refresh
    if (tabs.length <= 0) {
      return;
    }
    let url = tabs[0].url
    if (!url.startsWith("https://www.doordash.com/orders/")) {
      return;
    }
    url = url.substring(32)
    let index = url.indexOf("/")
    let orderId = url.substring(0, index)
    refresh(orderId);
  });
});

var orderDetails = {
  items: [],
  totalCharged: 0.0,
  subtotal: 0.0,
  tip: 0.0,
  peopleNumber: 0
}

function refresh(orderId) {
  chrome.cookies.getAll({
    domain: "doordash.com"
  }, function (cookies) {
    for (var i in cookies) {
      if (cookies[i].name === "csrf_token") {
        fetchOrderDetails(orderId, cookies[i].value, renderPage)
      }
    }
  });
}

function fetchOrderDetails(orderId, token, callBack) {
  orderDetails = {
    items: []
  }
  const req = new XMLHttpRequest();
  const baseUrl = "https://www.doordash.com/graphql?operation=getConsumerOrdersWithDetails";
  req.withCredentials = true;
  req.open("POST", baseUrl, true);
  req.setRequestHeader("Content-type", "application/json");
  req.setRequestHeader("x-csrftoken", token)
  req.send("{\"operationName\":\"getConsumerOrderReceipt\",\"variables\":{\"orderCartId\":\"" + orderId + "\"},\"query\":\"query getConsumerOrderReceipt($orderCartId: ID!) {\\n  getConsumerOrderReceipt(orderCartId: $orderCartId) {\\n    lineItems {\\n      ...lineItemFragment\\n      __typename\\n    }\\n    splitBillLineItems {\\n      consumerId\\n      lineItems {\\n        ...lineItemFragment\\n        __typename\\n      }\\n      __typename\\n    }\\n    commissionMessage\\n    storeName\\n    receiptOrders {\\n      ...ConvReceiptOrdersFragment\\n      __typename\\n    }\\n    orders {\\n      creator {\\n        id\\n        localizedNames {\\n          formalName\\n          informalName\\n          formalNameAbbreviated\\n          __typename\\n        }\\n        __typename\\n      }\\n      orderItemsList {\\n        id\\n        specialInstructions\\n        substitutionPreference\\n        quantity\\n        originalQuantity\\n        weightedActualQuantity\\n        item {\\n          id\\n          name\\n          price\\n          description\\n          priceMonetaryFields {\\n            unitAmount\\n            currency\\n            displayString\\n            decimalPlaces\\n            sign\\n            __typename\\n          }\\n          __typename\\n        }\\n        unitPriceMonetaryFields {\\n          currency\\n          unitAmount\\n          displayString\\n          __typename\\n        }\\n        optionsList {\\n          itemExtraOption {\\n            name\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      orderItemLineDetails {\\n        ...orderLineItemDetailsFragment\\n        __typename\\n      }\\n      __typename\\n    }\\n    doordashEntityInfo {\\n      entityName\\n      entityAddress\\n      entityVatId\\n      __typename\\n    }\\n    disclaimer\\n    liquorLicense {\\n      url\\n      label\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment ConvReceiptOrdersFragment on OrderReceipt {\\n  creatorId\\n  orderCartItemId\\n  removedList {\\n    ...ConvItemReceiptFragment\\n    __typename\\n  }\\n  itemsList {\\n    ...ConvItemReceiptFragment\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment ConvItemReceiptFragment on ItemReceipt {\\n  id\\n  specialInstructions\\n  substitutionPreference\\n  quantity\\n  originalQuantity\\n  weightedActualQuantity\\n  item {\\n    ...ConvItemReceiptDetailsFragment\\n    __typename\\n  }\\n  unitPriceMonetaryFields {\\n    displayString\\n    __typename\\n  }\\n  unitPriceWithOptionsMonetaryFields {\\n    displayString\\n    __typename\\n  }\\n  substitutedReceiptItem {\\n    quantity\\n    originalQuantity\\n    weightedActualQuantity\\n    item {\\n      ...ConvItemReceiptDetailsFragment\\n      __typename\\n    }\\n    unitPriceMonetaryFields {\\n      displayString\\n      __typename\\n    }\\n    unitPriceWithOptionsMonetaryFields {\\n      displayString\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment ConvItemReceiptDetailsFragment on ItemReceiptDetails {\\n  id\\n  name\\n  description\\n  price\\n  priceMonetaryFields {\\n    displayString\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment orderLineItemDetailsFragment on OrderItemLineDetailsReceipt {\\n  ...orderLineItemDetailsBaseFragment\\n  substituteItem {\\n    ...orderLineItemDetailsBaseFragment\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment orderLineItemDetailsBaseFragment on OrderItemLineDetailsReceipt {\\n  itemName\\n  subTotal {\\n    ...priceFragment\\n    __typename\\n  }\\n  specialInstructions\\n  substitutionPreference\\n  purchaseType\\n  isOutOfStock\\n  itemOptionDetailsList\\n  weightedSoldPriceInfo\\n  requestedQuantity {\\n    ...quantityInfoFragment\\n    __typename\\n  }\\n  fulfilledQuantity {\\n    ...quantityInfoFragment\\n    __typename\\n  }\\n  lineItemToolTipModal {\\n    title\\n    paragraphs {\\n      title\\n      description\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment priceFragment on AmountMonetaryFields {\\n  currency\\n  displayString\\n  unitAmount\\n  decimalPlaces\\n  sign\\n  __typename\\n}\\n\\nfragment quantityInfoFragment on Quantity {\\n  discreteQuantity {\\n    quantity\\n    unit\\n    __typename\\n  }\\n  continuousQuantity {\\n    quantity\\n    unit\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment lineItemFragment on LineItem {\\n  label\\n  labelIcon\\n  discountIcon\\n  chargeId\\n  finalMoney {\\n    unitAmount\\n    displayString\\n    __typename\\n  }\\n  originalMoney {\\n    unitAmount\\n    displayString\\n    __typename\\n  }\\n  tooltip {\\n    title\\n    paragraphs {\\n      description\\n      __typename\\n    }\\n    __typename\\n  }\\n  note\\n  __typename\\n}\\n\"}")
  req.onreadystatechange = function () { // Call a function when the state changes.
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
      let orderInfo = JSON.parse(this.responseText).data.getConsumerOrderReceipt
      let details = orderInfo.lineItems
      let reducedDetails = {}
      for (var i in details) {
        let name = details[i].chargeId
        let amount = details[i].finalMoney.unitAmount
        reducedDetails[name] = amount
      }
      orderDetails.tip = reducedDetails["TIP"]
      orderDetails.peopleNumber = orderDetails.tip
      orderDetails.subtotal = reducedDetails["SUBTOTAL"]
      orderDetails.totalCharged = reducedDetails["TOTAL"]
      let orderItems = orderInfo.orders[0].orderItemsList
      for (var i in orderItems) {
        let orderItem = orderItems[i]
        item = {
          shared: false
        }
        item.price = orderItem.unitPriceMonetaryFields.unitAmount / orderItem.quantity
        item.quantity = orderItem.quantity
        item.description = orderItem.item.description
        item.name = orderItem.item.name
        orderDetails.items.push(item)
      }
      renderPage()
    }

  }
}

function renderPage() {
  //clearDom();
  for (var i in orderDetails.items) {
    let item = orderDetails.items[i]
    let itemDom = generateItemDiv(item)
    itemDiv.appendChild(itemDom);
  }

  let div = document.createElement("div")
  div.class = "comment"
  div.textContent = "Select your ordered item and then plus $1 for the tip."
  itemDiv.appendChild(div)
}

function generateItemDiv(item) {
  let ratio = orderDetails.totalCharged/orderDetails.subtotal
  let div = document.createElement("div");
  let span1 = document.createElement("span");
  span1.textContent = item.name
  let span2 = document.createElement("span");
  span2.textContent = (item.price * ratio / 100).toFixed(2)
  let span3 = document.createElement("span");
  span3.textContent = item.description
  span3.id = "despSpan"
  div.append(span1)
  div.append(span2)
  div.append(span3)
  return div
}
