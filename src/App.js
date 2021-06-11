import {
  Button,
  Popover,
  Card,
  Form,
  Input,
  Select,
  List,
  Row,
  Col,
  message,
  InputNumber,
  Space,
  Modal,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import * as QRCode from "qrcode.react";
import {
  getWocAddressUrl,
  formatValue,
  isValidAddress,
  transferBsv,
  transferSensibleFt,
  getWocTransactionUrl,
  getSensibleFtHistoryUrl,
} from "./lib";
import * as createPostMsg from "post-msg";
import { getGlobalState, useGlobalState } from "./state/state";
import * as actions from "./state/action";
import { useOnceCall } from "./hooks";
import "./App.css";

const { Option } = Select;

function Header() {
  const [account] = useGlobalState("account");
  const [key] = useGlobalState("key");

  const handleLogout = () => {
    actions.saveAccount(null);
  };
  const handleHistory = () => {
    let url = getWocAddressUrl(account.network, key.address);
    window.open(url);
  };
  const handleSourceCode = () => {
    window.open("http://github.com");
  };

  return (
    <div className="header">
      <div className="logo">Web Wallet</div>
      {account && (
        <Popover
          title=""
          content={
            <>
              <Button type="link" onClick={handleLogout}>
                Logout
              </Button>
              <br />
              <Button type="link" onClick={handleHistory}>
                History
              </Button>
              <br />
              <Button type="link" onClick={handleSourceCode}>
                Source Code
              </Button>
            </>
          }
        >
          <Button type="link">{account.email}</Button>
        </Popover>
      )}
    </div>
  );
}

function LoginPanel() {
  const [account] = useGlobalState("account");
  const [form] = Form.useForm();

  const handleOnFinish = () => {
    const account = form.getFieldsValue();
    actions.saveAccount(account);
  };
  if (account) {
    return null;
  }

  return (
    <Card className="card" title="Login" bordered={false}>
      <Form form={form} layout="vertical" onFinish={handleOnFinish}>
        <Form.Item
          name="email"
          rules={[
            {
              type: "email",
              required: true,
              message: "Please input a valid Email!",
            },
          ]}
        >
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder="Email"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[
            { required: true, message: "Please input your Password!" },
            {
              min: 6,
              message: "Password at least 6 chars",
              transform: (value) => value && value.trim(),
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="site-form-item-icon" />}
            type="password"
            visibilityToggle={true}
            placeholder="Password"
          />
        </Form.Item>
        <Form.Item name="network" label="Network" rules={[{ required: true }]}>
          <Select placeholder="Select network">
            <Option value="mainnet">mainnet</Option>
            <Option value="testnet">testnet</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="login-form-button"
          >
            Log in
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

function AccountInfoPanel({ onWithDraw, onTransfer }) {
  const [key] = useGlobalState("key");
  const [account] = useGlobalState("account");
  const [bsvBalance] = useGlobalState("bsvBalance");
  const [sensibleFtList] = useGlobalState("sensibleFtList");
  const [satotxConfigMap] = useGlobalState("satotxConfigMap");

  if (!key) {
    return null;
  }
  const handleHistory = () => {
    let url = getWocAddressUrl(account.network, key.address);
    window.open(url);
  };
  const handleTransfer = (genesis) => {
    if (!genesis) {
      return onTransfer("");
    }
    if (!satotxConfigMap.has(genesis)) {
      return message.error("rabin api not set or found");
    }
    return onTransfer(genesis);
  };
  return [
    <Card
      className="card"
      title="Account Info"
      bordered={false}
      actions={
        <>
          <Button type="link" onClick={handleHistory}>
            history
          </Button>
          ,
          <Button type="link" onClick={onWithDraw}>
            withdraw
          </Button>
          ,
        </>
      }
    >
      <Form layout="vertical">
        <Form.Item label={`${account.network} address`}>
          <Input value={key.address} />
          <div style={{ margin: 20 }}>
            <QRCode value={key.address} />
          </div>
        </Form.Item>
        <Form.Item label="privateKey">
          <Input.Password visibilityToggle={true} value={key.privateKey} />
        </Form.Item>
      </Form>
    </Card>,
    <Card className="card" title="Asset" bordered={false}>
      <Form layout="vertical">
        {bsvBalance && (
          <Form.Item label="BSV balance">
            <Row justify="space-between">
              <Col span={16}>
                <div>{formatValue(bsvBalance.balance, 8)}</div>
              </Col>
              <Col span={7}>
                <Button type="link" onClick={() => handleTransfer("")}>
                  Transfer BSV
                </Button>
              </Col>
            </Row>
          </Form.Item>
        )}
        {sensibleFtList.length > 0 && (
          <Form.Item label="Sensible Fungible Token">
            <List
              itemLayout="horizontal"
              dataSource={sensibleFtList}
              renderItem={(item) => {
                return (
                  <List.Item
                    key={item.genesis}
                    actions={
                      <>
                        <Popover
                          placement="topRight"
                          content={
                            <>
                              <div>codehash: {item.codehash}</div>,
                              <div>genesis: {item.genesis}</div>,
                            </>
                          }
                        >
                          <a
                            key="list-loadmore-more"
                            href={getSensibleFtHistoryUrl(
                              account.network,
                              key.address,
                              item.genesis,
                              item.codehash
                            )}
                            target="_blank"
                          >
                            more info
                          </a>
                        </Popover>
                      </>
                    }
                  >
                    <List.Item.Meta
                      title={item.tokenSymbol}
                      description={item.tokenName}
                    />
                    <Row>
                      <Col>
                        <div
                          style={{
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          Balance:{" "}
                          {formatValue(item.balance, item.tokenDecimal)}
                        </div>
                      </Col>
                      <Col>
                        <Button
                          type="link"
                          onClick={() => handleTransfer(item.genesis)}
                        >
                          Go Transfer
                        </Button>
                      </Col>
                    </Row>
                  </List.Item>
                );
              }}
            ></List>
          </Form.Item>
        )}
      </Form>
    </Card>,
  ];
}

function TransferPanel({
  canEdit = true,
  genesis = "",
  initReceivers = [],
  onCancel,
  onTransferCallback,
}) {
  const [key] = useGlobalState("key");
  const [bsvBalance] = useGlobalState("bsvBalance");
  const [account] = useGlobalState("account");
  const [sensibleFtList] = useGlobalState("sensibleFtList");
  const [satotxConfigMap] = useGlobalState("satotxConfigMap");
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useOnceCall(() => {
    console.log("initReceivers", initReceivers);
    const isBsv = genesis === "";
    const token = sensibleFtList.find((item) => item.genesis === genesis);
    const decimal = isBsv ? 8 : token.tokenDecimal;
    form.setFieldsValue({
      receiverList: initReceivers.map((item) => {
        return {
          address: item.address,
          amount: item.amount / 10 ** decimal,
        };
      }),
    });
  }, key && bsvBalance && initReceivers.length);

  if (!key) {
    return null;
  }
  if (!bsvBalance) {
    return null;
  }
  if (genesis && !sensibleFtList.length) {
    return null;
  }

  const isBsv = genesis === "";
  const token = sensibleFtList.find((item) => item.genesis === genesis);

  if (!isBsv && !token) {
    return null;
  }
  const tokenSymbol = isBsv ? "BSV" : token.tokenSymbol;
  const decimal = isBsv ? 8 : token.tokenDecimal;
  const balance = isBsv ? bsvBalance.balance : token.balance;
  const formatBalance = formatValue(balance, decimal);

  const handleSubmit = async () => {
    const { receiverList } = form.getFieldsValue();
    const totalOutputValue =
      receiverList.reduce((prev, cur) => prev + cur.amount, 0) * 10 ** decimal;
    if (balance < totalOutputValue) {
      const msg = "Insufficient balance";
      onTransferCallback({
        error: msg,
      });
      return message.error(msg);
    }

    if (!isBsv && !satotxConfigMap.has(genesis)) {
      const msg = "Token rabin signer not set yet";
      onTransferCallback({
        error: msg,
      });
      return message.error(msg);
    }

    const formatReceiverList = receiverList.map((item) => {
      return {
        address: item.address,
        amount: item.amount * 10 ** decimal,
      };
    });

    const broadcastBsv = async () => {
      setLoading(true);
      let txid = "";
      try {
        const res = await await transferBsv(
          account.network,
          key.privateKey,
          formatReceiverList
        );
        txid = res.txid;
      } catch (err) {
        const msg = "broadcast error: " + err.toString();
        onTransferCallback({
          error: msg,
        });
        console.log("broadcast bsv error ", err);
        message.error(err.toString());
      }
      setLoading(false);
      if (txid) {
        onTransferCallback({
          response: {
            txid,
          },
        });
        Modal.success({
          title: "Transaction broadcast success",
          content: (
            <div>
              txid:{" "}
              <a
                target="_blank"
                href={getWocTransactionUrl(account.network, txid)}
              >
                {txid}
              </a>
            </div>
          ),
        });
      }
    };

    const broadcastSensibleFt = async () => {
      setLoading(true);
      let txid = "";
      try {
        const res = await transferSensibleFt(
          account.network,
          satotxConfigMap.get(genesis),
          key.privateKey,
          formatReceiverList,
          token.codehash,
          token.genesis
        );
        txid = res.txid;
      } catch (err) {
        console.log("broadcast sensible ft error ", err);
        message.error(err.toString());
      }
      setLoading(false);
      if (txid) {
        Modal.success({
          title: "Transaction broadcast success",
          content: (
            <div>
              txid:{" "}
              <a
                target="_blank"
                href={getWocTransactionUrl(account.network, txid)}
              >
                {txid}
              </a>
            </div>
          ),
        });
      }
    };

    Modal.confirm({
      title: "Confirm the transaction",
      onOk: () => {
        isBsv ? broadcastBsv() : broadcastSensibleFt();
      },
    });
  };
  const handleBack = () => {
    onCancel();
  };

  return (
    <Card
      className="card"
      title={
        <div style={{ cursor: "pointer" }} onClick={handleBack}>
          <LeftOutlined />
          Transfer
        </div>
      }
      loading={loading}
      bordered={false}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="transfer-line">
          {isBsv ? `Coin: ${tokenSymbol}` : `Token: ${tokenSymbol}`}
        </div>
        {!isBsv && (
          <div className="transfer-line">Genesis: {token.genesis}</div>
        )}
        {!isBsv && (
          <div className="transfer-line">Codehash: {token.codehash}</div>
        )}
        <Row justify="space-between" style={{ margin: "10px 0" }}>
          <Col span={14}>
            <div style={{ fontWeight: 700 }}>Input</div>
          </Col>
        </Row>
        <div className="transfer-line">{`Balance: ${formatBalance}`}</div>
        <div className="transfer-line">{`From Address: ${key.address}`}</div>
        <Row justify="space-between" style={{ margin: "10px 0" }}>
          <Col span={14}>
            <div style={{ fontWeight: 700 }}>Output</div>
          </Col>
        </Row>
        <Form.List name="receiverList">
          {(fields, { add, remove }) => (
            <>
              {fields.map((key, name, fieldKey, ...restField) => {
                return (
                  <Space
                    key={key.fieldKey}
                    style={{ display: "flex", marginBottom: 8 }}
                    align="baseline"
                  >
                    <Form.Item
                      {...restField}
                      name={[name, "address"]}
                      fieldKey={[fieldKey, "address"]}
                      rules={[
                        {
                          required: true,
                          message: "Please input the address",
                        },
                        {
                          message: "invalid address",
                          validator: (_, value) =>
                            isValidAddress(account.network, value)
                              ? Promise.resolve()
                              : Promise.reject(),
                        },
                      ]}
                    >
                      <Input
                        placeholder="Input the address"
                        disabled={!canEdit}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "amount"]}
                      fieldKey={[fieldKey, "amount"]}
                      rules={[
                        { required: true, message: "Please input amount" },
                      ]}
                    >
                      <InputNumber
                        placeholder="Amount"
                        min={0}
                        disabled={!canEdit}
                      />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                );
              })}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                >
                  Add Output
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Transfer
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

function App() {
  useEffect(() => {
    actions.recoverAccountFromStorage();
  }, []);

  const [trasfering, setTransfering] = useState(false);
  const [trasferSensibleFtGenesis, setTrasferSensibleFtGenesis] = useState("");
  const [account] = useGlobalState("account");
  const [key] = useGlobalState("key");
  const [bsvBalance] = useGlobalState("bsvBalance");
  const [sensibleFtList] = useGlobalState("sensibleFtList");
  const [initReceivers, setInitReceivers] = useState([]);

  const handleTransfer = (genesis) => {
    setTransfering(true);
    genesis && setTrasferSensibleFtGenesis(genesis);
  };
  const handleCancelTransfer = () => {
    setTransfering(false);
    setTrasferSensibleFtGenesis("");
  };

  const getHashData = () => {
    if (!window.opener) {
      return null;
    }
    const hash = window.location.hash.substr(1);
    try {
      const data = JSON.parse(decodeURIComponent(hash));
      if (data.type === "popup") {
        if (typeof data.data === "object") {
          return data;
        }
      }
    } catch (err) {}
    return null;
  };
  const handlePopResponseCallback = (resObj) => {
    const data = getHashData();
    if (!data) {
      return;
    }
    const postMsg = createPostMsg(window.opener, "*");
    postMsg.emit(data.id, {
      type: "response",
      data: {
        ...data.data.data,
        ...resObj,
      },
    });
  };

  // todo 数值计算 使用 bignumber
  // todo 此处接收 postMessage 消息，处理登录,transfer
  const requestAccountCondition = key?.address && account?.network;
  const transferBsvCondition =
    requestAccountCondition && bsvBalance && bsvBalance.balance >= 0;
  useOnceCall(() => {
    const data = getHashData();
    if (!data || data.data.type !== "request") {
      return;
    }

    const { method, params } = data.data.data;
    if (method !== "requestAccount") {
      return;
    }
    Modal.confirm({
      title: "Connect",
      content: `Allow ${params.name} to connect your web wallet`,
      onOk: () => {
        handlePopResponseCallback({ response: true });
      },
      onCancel: () => {
        handlePopResponseCallback({ error: "user reject" });
      },
    });
  }, !!requestAccountCondition);
  useOnceCall(() => {
    const data = getHashData();
    if (!data || data.data.type !== "request") {
      return;
    }

    const { method, params } = data.data.data;
    if (method !== "transferBsv") {
      return;
    }
    // balance check
    const outputTotal = params.receivers.reduce(
      (prev, cur) => prev + cur.amount,
      0
    );
    if (outputTotal >= bsvBalance.balance) {
      handlePopResponseCallback({ error: "insufficient balance" });
      return;
    }
    setTransfering(true);
    setInitReceivers(params.receivers);
  }, !!transferBsvCondition);
  useOnceCall(() => {
    const data = getHashData();
    if (!data || data.data.type !== "request") {
      return;
    }

    const { method, params } = data.data.data;
    if (method !== "transferSensibleFt") {
      return;
    }
    // sensibleft balance check
    const outputTotal = params.receivers.reduce(
      (prev, cur) => prev + cur.amount,
      0
    );
    const ft = sensibleFtList.find((item) => item.genesis === params.genesis);
    if (!ft) {
      handlePopResponseCallback({ error: "insufficient balance" });
      return;
    }
    if (outputTotal >= ft.balance) {
      handlePopResponseCallback({ error: "insufficient balance" });
      return;
    }
    setTrasferSensibleFtGenesis(params.genesis);
    setInitReceivers(params.receivers);
  }, !!transferBsvCondition);
  useEffect(() => {
    window.onbeforeunload = function () {
      handlePopResponseCallback({ error: "use closed" });
    };
  }, []);

  return (
    <div className="App" style={{ overflow: "hidden" }}>
      <Header accountName="harry" />
      <LoginPanel />
      {!trasfering && <AccountInfoPanel onTransfer={handleTransfer} />}
      {trasfering && (
        <TransferPanel
          genesis={trasferSensibleFtGenesis}
          onCancel={handleCancelTransfer}
          onTransferCallback={handlePopResponseCallback}
          initReceivers={initReceivers}
        />
      )}
    </div>
  );
}

export default App;
