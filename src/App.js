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
  MinusOutlined,
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
  parseTransaction,
} from "./lib";
import * as createPostMsg from "post-msg";
import { useGlobalState, defaultSatotx } from "./state/state";
import * as actions from "./state/action";
import { useOnceCall } from "./hooks";
import "./App.css";
import * as util from "./lib/util";
import * as Sentry from "@sentry/react";

const { Option } = Select;

function Header() {
  const [account] = useGlobalState("account");
  const [key] = useGlobalState("key");
  const [decodeModalVisible, setDecodeModalVisible] = useState(false);
  const [rawtx, setRawtx] = useState("");
  const [network, setNetwork] = useState("");
  const [resultModalVisible, setResultModalVisible] = useState(false);

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

  const decodeTx = () => {
    const res = parseTransaction(network, rawtx);
    console.log("decodeTx res", res);
  };

  return (
    <div className="header">
      <div className="logo">Web Wallet return</div>
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
              <br />
              <Button type="link" onClick={() => setDecodeModalVisible(true)}>
                decode rawtx
              </Button>
            </>
          }
        >
          <Button type="link">{account.email}</Button>
        </Popover>
      )}
      <Modal
        visible={decodeModalVisible}
        onCancel={() => setDecodeModalVisible(false)}
      >
        <Input.TextArea
          rows={4}
          value={rawtx}
          onChange={(e) => setRawtx(e.target.value)}
        ></Input.TextArea>
        <Select
          style={{ width: 180 }}
          placeholder="Select network"
          value={network}
          onChange={(value) => setNetwork(value)}
        >
          <Option value="mainnet">mainnet</Option>
          <Option value="testnet">testnet</Option>
        </Select>
        <Button type="primary" onClick={decodeTx}>
          decode
        </Button>
      </Modal>
      <Modal
        visible={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
      ></Modal>
    </div>
  );
}

function LoginPanel() {
  const [account] = useGlobalState("account");
  const [form] = Form.useForm();

  const handleOnFinish = () => {
    Modal.confirm({
      title: "安全注意",
      content: (
        <div>
          Web钱包的私钥是通过用户的用户名和密码实时计算得到，不会上传服务器，也不会保存在本地(代码见
          <a
            href="https://github.com/klouskingsley/bsv-web-wallet"
            target="_blank"
            rel="noreferrer"
          >
            github
          </a>
          )。仅供方便用户测试之用，不适合存放大量资金，建议用户妥善保管用户名+密码组合以防资金丢失，或在使用完成之后将剩余资金转移。用户名+密码组合丢失(忘记，被盗等情形)会导致资产丢失
        </div>
      ),
      onOk: () => {
        const account = form.getFieldsValue();
        actions.saveAccount(account);
      },
    });
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

  if (!key || !account) {
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
    // if (!satotxConfigMap.has(genesis)) {
    //   return message.error("rabin api not set or found");
    // }
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
                            rel="noreferrer"
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
  const canEdit = !(initReceivers.length > 0);

  useOnceCall(() => {
    const isBsv = genesis === "";
    const token = sensibleFtList.find((item) => item.genesis === genesis);
    const decimal = isBsv ? 8 : token.tokenDecimal;
    console.log(
      "initReceivers",
      initReceivers,
      initReceivers.map((item) => {
        return {
          address: item.address,
          amount: util.multi(item.amount, util.getDecimalString(decimal)),
        };
      })
    );
    form.setFieldsValue({
      receiverList: initReceivers.map((item) => {
        return {
          address: item.address,
          amount: util.div(item.amount, util.getDecimalString(decimal)),
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
    const totalOutputValueFloatDuck = receiverList.reduce(
      (prev, cur) => util.plus(prev, cur.amount),
      0
    );

    const totalOutputValue = util.multi(
      totalOutputValueFloatDuck,
      util.getDecimalString(decimal)
    );
    if (util.lessThan(balance, totalOutputValue)) {
      const msg = "Insufficient ft balance";
      onTransferCallback({
        error: msg,
      });
      return message.error(msg);
    }
    const formatReceiverList = receiverList.map((item) => {
      return {
        address: item.address,
        amount: util.multi(item.amount, util.getDecimalString(decimal)),
      };
    });

    const broadcastBsv = async () => {
      setLoading(true);
      let txid = "";
      let transferRes;
      try {
        const res = await await transferBsv(
          account.network,
          key.privateKey,
          formatReceiverList
        );
        transferRes = res;
        txid = res.txid;
      } catch (err) {
        const msg = "broadcast error: " + err.toString();
        console.log(
          JSON.stringify({
            type: "bsvTransferFail",
            msg,
            account: {
              network: account.network,
              address: key.address,
            },
            receivers: formatReceiverList,
          })
        );
        Sentry.captureException(err);
        Sentry.captureMessage(`bsvTransferFail_${key.address}`);
        onTransferCallback({
          error: msg,
        });
        console.log("broadcast bsv error ");
        console.error(err);
        message.error(err.toString());
      }
      setLoading(false);
      if (txid) {
        console.log(
          JSON.stringify({
            type: "bsvTransferSuccess",
            account: {
              network: account.network,
              address: key.address,
            },
            receivers: formatReceiverList,
            txid,
            ...transferRes,
          })
        );
        Sentry.captureMessage(`bsvTransferSuccess_${key.address}_${txid}`);
        onTransferCallback({
          response: {
            ...transferRes,
          },
        });
        Modal.success({
          title: "Transaction broadcast success",
          content: (
            <div>
              txid:{" "}
              <a
                target="_blank"
                rel="noreferrer"
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
      let transferRes;
      try {
        const signers = satotxConfigMap.get(genesis) || [
          defaultSatotx,
          defaultSatotx,
          defaultSatotx,
        ];
        const res = await transferSensibleFt(
          account.network,
          signers,
          key.privateKey,
          formatReceiverList,
          token.codehash,
          token.genesis
        );
        transferRes = res;
        txid = res.txid;
      } catch (err) {
        console.log("broadcast sensible ft error ");
        console.error(err);
        message.error(err.toString());
        console.log(
          JSON.stringify({
            type: "ftTransferFail",
            msg: JSON.stringify(err.message),
            account: {
              network: account.network,
              address: key.address,
            },
            genesis: token.genesis,
            codehash: token.codehash,
            receivers: formatReceiverList,
          })
        );
        Sentry.captureException(err);
        Sentry.captureMessage(
          `ftTransferFail_${key.address}_${token.genesis}_${token.genesis}`
        );
        onTransferCallback({
          error: err.toString(),
        });
      }
      setLoading(false);
      if (txid) {
        console.log(
          JSON.stringify({
            type: "ftTransferSuccess,",
            account: {
              network: account.network,
              address: key.address,
              genesis: token.genesis,
              codehash: token.codehash,
            },
            receivers: formatReceiverList,
            txid,
            ...transferRes,
          })
        );
        Sentry.captureMessage(`ftTransferSuccess_${key.address}_${txid}`);
        onTransferCallback({
          response: {
            ...transferRes,
          },
        });
        Modal.success({
          title: "Transaction broadcast success",
          content: (
            <div>
              txid:{" "}
              <a
                target="_blank"
                rel="noreferrer"
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
                    <Button
                      disabled={!canEdit}
                      size="small"
                      onClick={() => remove(name)}
                      shape="circle"
                      icon={<MinusOutlined />}
                    />
                  </Space>
                );
              })}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  disabled={!canEdit}
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
    requestAccountCondition &&
    bsvBalance &&
    util.greaterThanEqual(bsvBalance.balance, 0);
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
      content: (
        <div>
          Allow <b>{params.name}</b> to connect your web wallet
        </div>
      ),
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
    console.log("bsv hash data", data);
    if (!data || data.data.type !== "request") {
      return;
    }

    const { method, params } = data.data.data;
    if (method !== "transferBsv") {
      return;
    }
    // balance check
    const outputTotal = params.receivers.reduce(
      (prev, cur) => util.plus(prev, cur.amount),
      0
    );
    if (util.greaterThan(outputTotal, bsvBalance.balance)) {
      handlePopResponseCallback({ error: "insufficient bsv balance" });
      return;
    }
    setTransfering(true);
    setInitReceivers(params.receivers);
  }, !!transferBsvCondition);
  useOnceCall(() => {
    const data = getHashData();
    console.log("hashdata", data);
    if (!data || data.data.type !== "request") {
      return;
    }

    const { method, params } = data.data.data;
    if (method !== "transferSensibleFt") {
      return;
    }
    // sensibleft balance check
    const outputTotal = params.receivers.reduce(
      (prev, cur) => util.plus(prev, cur.amount),
      0
    );
    console.log("outputTotal", outputTotal);
    const ft = sensibleFtList.find((item) => item.genesis === params.genesis);
    console.log("ft", ft);
    if (!ft) {
      handlePopResponseCallback({ error: "insufficient ft balance" });
      return;
    }
    if (util.greaterThan(outputTotal, ft.balance)) {
      handlePopResponseCallback({ error: "insufficient ft balance" });
      return;
    }
    setTransfering(true);
    setTrasferSensibleFtGenesis(params.genesis);
    setInitReceivers(params.receivers);
  }, !!transferBsvCondition);
  useEffect(() => {
    const obu = window.onbeforeunload;
    window.onbeforeunload = function (event) {
      handlePopResponseCallback({ error: "use closed" });
      return obu && obu(event);
    };
  });

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
