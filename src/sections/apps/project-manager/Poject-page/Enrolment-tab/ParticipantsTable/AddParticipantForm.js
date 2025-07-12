import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  createFilterOptions,
  DialogActions,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  FormHelperText,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// third-party
import _ from "lodash";
import * as Yup from "yup";
import { useFormik, Form, FormikProvider } from "formik";

// project imports
import AlertCustomerDelete from "../AlertCustomerDelete";
import Avatar from "components/@extended/Avatar";
import IconButton from "components/@extended/IconButton";
import MainCard from "components/MainCard";
import { openSnackbar } from "store/reducers/snackbar";
import ColorPalette from "../ColorPalette";
import TransferLists from "./transferLists";

// assets
import {
  CameraOutlined,
  DeleteFilled,
  CloseOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { message } from "antd";

// constant
const getInitialValues = (customer) => {
  const newCustomer = {
    firstName: "",
    lastName: "",
    email: "",
    group: "",
    group: "",
  };

  if (customer) {
    newCustomer.group = customer.address;
    return _.merge({}, newCustomer, customer);
  }

  return newCustomer;
};
const roles = ["User", "Admin", "Staff", "Manager"];
const filter = createFilterOptions();
const allStatus = ["Active", "LOA", "Terminated"];

const fakeData = [
  {
    id: "f2dbe0bb-8c2f-471e-9fdb-5ae1e543cb9f",
    firstName: "Dd",
    middleName: null,
    lastName: "Dd",
    email: "nelsonaudiddsdsdopro@gmail.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:37:47.821Z",
    lastUpdated: "2024-01-19T02:37:47.821Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "ef095dc7-d7f7-4b9b-89aa-9b5cc9d943c2",
    firstName: "Marc",
    middleName: null,
    lastName: "Nelson",
    email: "nelson.marc@hotmail.comeeeeeeee",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:07:45.561Z",
    lastUpdated: "2024-01-19T02:07:45.561Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "e4a161c4-af0e-49b0-8afb-9deebd405362",
    firstName: "Dd",
    middleName: null,
    lastName: "Dd",
    email: "nelsonadsdsdsdudiopro@gmail.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:34:27.242Z",
    lastUpdated: "2024-01-19T02:34:27.242Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "e3add79a-f368-4277-8a1a-eb71f6379990",
    firstName: "Hre",
    middleName: null,
    lastName: "Fff",
    email: "nelson.marc.perso@gmail.comsdddd",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T01:26:05.995Z",
    lastUpdated: "2024-01-19T01:26:05.995Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "e32ffcb4-00e9-40ce-8891-de2121a31e76",
    firstName: "keshawan ",
    middleName: null,
    lastName: "richard",
    email: "nelsonaudiopro@gmail.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-07T17:46:28.814Z",
    lastUpdated: "2024-01-07T17:46:28.814Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "dfc72e6f-1a84-45f3-aeca-1d5b0fa861b8",
    firstName: "Ya",
    middleName: null,
    lastName: "Boy",
    email: "mnelson@360.agencyssssss",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-15T22:59:39.952Z",
    lastUpdated: "2024-01-15T22:59:39.952Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "da5992fb-fd93-4ac1-b319-53398e2e281e",
    firstName: "Joe ",
    middleName: null,
    lastName: "2",
    email: "now@email.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-08T18:01:09.062Z",
    lastUpdated: "2024-01-08T18:01:09.062Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "d366f12f-df11-459a-8acf-360b2ccf7032",
    firstName: "Ddd",
    middleName: null,
    lastName: "Fff",
    email: "ddjkdj@ss.co",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-10T17:51:39.997Z",
    lastUpdated: "2024-01-10T17:51:39.997Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "c3a54d3b-a519-488e-a1c4-27ff95f150b0",
    firstName: "Marc",
    middleName: null,
    lastName: "Nelson",
    email: "nelson.marc.perso@gmail.comfffffff",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-18T23:02:35.489Z",
    lastUpdated: "2024-01-18T23:02:35.489Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "b9102455-9690-4969-9a71-ea0a8c7c0216",
    firstName: "Marc",
    middleName: null,
    lastName: "Nelson",
    email: "sssnelson.marc.perso@gmail.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:13:19.834Z",
    lastUpdated: "2024-01-19T02:13:19.834Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "aa71f1e6-cdd1-4fd0-938a-a5a9db32187f",
    firstName: "Ddd",
    middleName: null,
    lastName: "Ddd",
    email: "2222nelsonaudiopro@gmail.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:29:24.038Z",
    lastUpdated: "2024-01-19T02:29:24.038Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "a52a59a8-b74f-4baf-a3a7-8b51a489f855",
    firstName: "Yoo2",
    middleName: null,
    lastName: "Sdddd",
    email: "mnelson@360.agencyaaaa",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:10:34.194Z",
    lastUpdated: "2024-01-19T02:10:34.194Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "a4dc13d5-6c8c-476c-8bd7-bc1d969baa9e",
    firstName: "Fff",
    middleName: null,
    lastName: "Feefe",
    email: "nelsonaudiopro@gmail.comeeeeee",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T01:51:56.656Z",
    lastUpdated: "2024-01-19T01:51:56.656Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "9eb6d9da-163b-4601-9159-f6d27cd92e8e",
    firstName: "Marc",
    middleName: null,
    lastName: "Nelson",
    email: "nelson.marc.perso@gmail.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-07T18:40:01.078Z",
    lastUpdated: "2024-01-07T18:40:01.078Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "9768e4b3-cf4c-4388-800f-25d9d11c440e",
    firstName: "Fdfdf",
    middleName: null,
    lastName: "Dfdfd",
    email: "nelson.mewewewewarc.perso@gmail.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:38:35.273Z",
    lastUpdated: "2024-01-19T02:38:35.273Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "88a3f2e6-3ddc-4253-8fb8-23d1b3851a00",
    firstName: "Joe",
    middleName: null,
    lastName: "Laforce",
    email: "nelsonaudiopro@gmail.commm",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-10T17:56:05.412Z",
    lastUpdated: "2024-01-10T17:56:05.412Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "8391ca0b-2331-4178-b2ec-10731c0f29fb",
    firstName: "DG",
    middleName: null,
    lastName: "Du dealer",
    email: "mnelson@360.agency",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-07T19:57:06.492Z",
    lastUpdated: "2024-01-07T19:57:06.492Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "7b4e763d-48df-41cd-91bb-7946e2ec82f1",
    firstName: "Marc",
    middleName: null,
    lastName: "Nelson",
    email: "no@email.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-07T18:44:33.076Z",
    lastUpdated: "2024-01-07T18:44:33.076Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "6eeef11e-f811-4200-b710-2a6c11ffc70a",
    firstName: "Cc",
    middleName: null,
    lastName: "Dd",
    email: "nelsddddon.marc.perso@gmail.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:21:21.395Z",
    lastUpdated: "2024-01-19T02:21:21.395Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "6d1d4a8d-99c5-41c6-8fae-008fa2f0130b",
    firstName: "Cdcdc",
    middleName: null,
    lastName: "Vvvgfvf",
    email: "nelsonaudiopro@gmail.comzssss",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:06:09.704Z",
    lastUpdated: "2024-01-19T02:06:09.704Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "64368079-02cf-49aa-9935-cad33fcb2d79",
    firstName: "Marc",
    middleName: null,
    lastName: "Nelson",
    email: "nelson.marc.perso@gmail.comdsdsdsds",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-10T18:00:59.790Z",
    lastUpdated: "2024-01-10T18:00:59.790Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "63aa053d-facc-4ee4-a237-1dedda37f6d0",
    firstName: "Kkkkk",
    middleName: null,
    lastName: "Jjjj",
    email: "mnelson@360.agencyyyyy",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-13T15:43:33.128Z",
    lastUpdated: "2024-01-13T15:43:33.128Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "5d09941f-8d56-4fc8-9d2e-dfca4a66b54a",
    firstName: "Ttt",
    middleName: null,
    lastName: "Ff",
    email: "mnelson@360.agencyvvv",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:15:29.606Z",
    lastUpdated: "2024-01-19T02:15:29.606Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "5c36bab0-3137-4604-9829-758261f08d16",
    firstName: "Yoo",
    middleName: null,
    lastName: "Sss",
    email: "111nelson.marc.perso@gmail.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:08:44.944Z",
    lastUpdated: "2024-01-19T02:08:44.944Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "5a80e4c6-4190-48e2-a9d0-4116fbffde2d",
    firstName: "Alfonse",
    middleName: null,
    lastName: "Tremblay",
    email: "gyy@ftyum.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-13T15:25:55.361Z",
    lastUpdated: "2024-01-13T15:25:55.361Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "57505c29-3b3e-49cd-9aab-321ffbabc1e6",
    firstName: "Ddd",
    middleName: null,
    lastName: "Ff",
    email: "nelson.mffffgarc.perso@gmail.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:23:03.279Z",
    lastUpdated: "2024-01-19T02:23:03.279Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "52b2be10-694d-491e-844f-24423bfcb15d",
    firstName: "This ",
    middleName: null,
    lastName: "Is a fix",
    email: "mnelson@360.agencykjfkdjf",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-14T21:59:34.474Z",
    lastUpdated: "2024-01-14T21:59:34.474Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "4422d602-aa5d-11ee-8e2e-2213fee10076",
    firstName: "Bob",
    middleName: "C",
    lastName: "Williams",
    email: "bob.williams@example.com",
    participantStatus: "Active",
    participantType: "Type4",
    sub_organization: 1,
    derpartement: "Department4",
    roleId: "1",
    notes: "Note4",
    profilePrefs: {
      key4: "value4",
    },
    profileImg: "img4.jpg",
    credentials: {
      key4: "cred4",
    },
    createdAt: "2024-01-03T17:26:44.000Z",
    lastUpdated: "2024-01-03T17:26:44.000Z",
    updatedby: "admin",
    createdBy: "admin",
  },
  {
    id: "4422d4cb-aa5d-11ee-8e2e-2213fee10076",
    firstName: "Alice",
    middleName: null,
    lastName: "Johnson",
    email: "alice.johnson@example.com",
    participantStatus: "Inactive",
    participantType: "Type3",
    sub_organization: 1,
    derpartement: "Department3",
    roleId: "1",
    notes: "Note3",
    profilePrefs: {
      key3: "value3",
    },
    profileImg: "img3.jpg",
    credentials: {
      key3: "cred3",
    },
    createdAt: "2024-01-03T17:26:44.000Z",
    lastUpdated: "2024-01-03T17:26:44.000Z",
    updatedby: "admin",
    createdBy: "admin",
  },
  {
    id: "4422d11e-aa5d-11ee-8e2e-2213fee10076",
    firstName: "Jane",
    middleName: "B",
    lastName: "Smith",
    email: "jane.smith@example.com",
    participantStatus: "Active",
    participantType: "Type2",
    sub_organization: 1,
    derpartement: "Department2",
    roleId: "1",
    notes: "Note2",
    profilePrefs: {
      key2: "value2",
    },
    profileImg: "img2.jpg",
    credentials: {
      key2: "cred2",
    },
    createdAt: "2024-01-03T17:26:44.000Z",
    lastUpdated: "2024-01-03T17:26:44.000Z",
    updatedby: "admin",
    createdBy: "admin",
  },
  {
    id: "4422afa6-aa5d-11ee-8e2e-2213fee10076",
    firstName: "John",
    middleName: "A",
    lastName: "Doe",
    email: "john.doe@example.com",
    participantStatus: "Active",
    participantType: "Type1",
    sub_organization: 1,
    derpartement: "Department1",
    roleId: "1",
    notes: "Note1",
    profilePrefs: {
      key1: "value1",
    },
    profileImg: "img1.jpg",
    credentials: {
      key1: "cred1",
    },
    createdAt: "2024-01-03T17:26:44.000Z",
    lastUpdated: "2024-01-03T17:26:44.000Z",
    updatedby: "admin",
    createdBy: "admin",
  },
  {
    id: "3f2a1566-fd7f-4e28-9928-956a51d05b3c",
    firstName: "Wwwew",
    middleName: null,
    lastName: "Wewewe",
    email: "nelsonaudiopro@gmail.comsssss",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T01:57:55.186Z",
    lastUpdated: "2024-01-19T01:57:55.186Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "3ea9aa5d-042f-418d-88dc-d04596d926b7",
    firstName: "Vvv",
    middleName: null,
    lastName: "Bbb",
    email: "nelson.marc@hotmail.comvvvv",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:18:02.809Z",
    lastUpdated: "2024-01-19T02:18:02.809Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "3bb3e334-3e66-46ba-81b1-8d1da3e8b5d8",
    firstName: "Vv",
    middleName: null,
    lastName: "Ff",
    email: "nssselson.marc.perso@gmail.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:30:50.910Z",
    lastUpdated: "2024-01-19T02:30:50.910Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "3b0d5e93-f99d-42f2-a576-708ebd4d2e80",
    firstName: "Marc",
    middleName: null,
    lastName: "Nelson",
    email: "nelson.m545454arc.perso@gmail.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:39:59.335Z",
    lastUpdated: "2024-01-19T02:39:59.335Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "34860d73-785f-43ac-a45e-d9875dcdc627",
    firstName: "Marc",
    middleName: null,
    lastName: "Nelson",
    email: "nelson.marc.perso@gmail.comkok",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-10T18:00:27.883Z",
    lastUpdated: "2024-01-10T18:00:27.883Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "34265298-4c7e-4e9b-baaa-1e05f10dfaf6",
    firstName: "Marc",
    middleName: null,
    lastName: "Nelson",
    email: "yo@rma.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-10T17:49:54.558Z",
    lastUpdated: "2024-01-10T17:49:54.558Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "2b726469-62a0-4878-b14d-e6e242c35a1d",
    firstName: "Marc",
    middleName: null,
    lastName: "Nelson",
    email: "nelson.marc.perso@gmail.comss",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-10T17:33:26.392Z",
    lastUpdated: "2024-01-10T17:33:26.392Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "056968b3-bd38-4c08-94cf-0ed66637e448",
    firstName: "Sxddcd",
    middleName: null,
    lastName: "Dcdcdc",
    email: "mnelson@360.agencyccccccc",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-19T02:01:41.630Z",
    lastUpdated: "2024-01-19T02:01:41.630Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "01938d14-206f-4e1c-9ed2-3a02437fb660",
    firstName: "Joe",
    middleName: null,
    lastName: "Test ",
    email: "no@ok.com",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-08T17:38:53.747Z",
    lastUpdated: "2024-01-08T17:38:53.747Z",
    updatedby: null,
    createdBy: null,
  },
  {
    id: "008f06b4-a808-48b2-a2c3-e2ffd3ca7a95",
    firstName: "Bob",
    middleName: null,
    lastName: "Eponge",
    email: "nelson.marc@hotmail.comddddd",
    participantStatus: "Active",
    participantType: null,
    sub_organization: 1,
    derpartement: "Active",
    roleId: "[object Undefined]",
    notes: null,
    profilePrefs: {
      key1: "value1",
    },
    profileImg: null,
    credentials: {
      username: "bob",
    },
    createdAt: "2024-01-14T22:01:03.524Z",
    lastUpdated: "2024-01-14T22:01:03.524Z",
    updatedby: null,
    createdBy: null,
  },
];

const selectedEnrollees = [
  {
    id: 310,
    projectId: 21,
    participantId: "dfc72e6f-1a84-45f3-aeca-1d5b0fa861b8",
    participant: {
      id: "dfc72e6f-1a84-45f3-aeca-1d5b0fa861b8",
      firstName: "Ya",
      middleName: null,
      lastName: "Boy",
      email: "mnelson@360.agencyssssss",
      participantStatus: "Active",
      participantType: null,
      sub_organization: 1,
      derpartement: "Active",
      roleId: "[object Undefined]",
      notes: null,
      profilePrefs: {
        key1: "value1",
      },
      profileImg: null,
      credentials: {
        username: "bob",
      },
      createdAt: "2024-01-15T22:59:39.952Z",
      lastUpdated: "2024-01-15T22:59:39.952Z",
      updatedby: null,
      createdBy: null,
    },
    group: [],
  },
][0].participant;

// ==============================|| CUSTOMER ADD / EDIT / DELETE ||============================== //

const AddParticipantForm = ({
  customer,
  onCancel,
  title,
  handleCRUD,
  groups,
  error,
}) => {
  const { handleAddParticipant, handleAddMany } = handleCRUD;
  const theme = useTheme();
  const dispatch = useDispatch();
  const { employees } = useSelector((state) => state.projects);
  const { project_participants:enrolled } = useSelector((state) => state.projects);
  const isCreating = !customer;
  //const employees = fakeData;
  //const enrolled = [selectedEnrollees];

  const [selectedEnrollees, setSelectedEnrollees] = useState(enrolled);
  console.log(selectedEnrollees);
  const handleSelectedEnrollee = (selected) => {
    setSelectedEnrollees(selected);
  };
  const enrolledIds = enrolled.map(enrollment => enrollment.participantId);

  const filteredSelectedEnrollees = selectedEnrollees.filter(selectedEnrollee => {
    return (
        !enrolledIds.includes(selectedEnrollee.id) &&
        typeof selectedEnrollee.projectId === 'undefined'
    );
});
  
  console.log(filteredSelectedEnrollees);
  
  
  console.log(enrolled);
  

  const [singleParticipant, setSingleParticipant] = useState(false);
  const [selectedImage, setSelectedImage] = useState(undefined);
  const [avatar, setAvatar] = useState(
    `/assets/images/users/avatar-${
      isCreating && !customer?.avatar ? 1 : customer.avatar
    }.png`
  );
  const [isNewGroup, setIsNewGroup] = useState(false); // State variable for checkbox

  function handleAddMultiple() {
    setSingleParticipant((pre) => !pre);
  }

  const backgroundColor = [
    {
      value: theme.palette.primary.main,
      color: "primary.main",
    },
    {
      value: theme.palette.error.main,
      color: "error.main",
    },
    {
      value: theme.palette.success.main,
      color: "success.main",
    },
    {
      value: theme.palette.secondary.main,
      color: "secondary.main",
    },
    {
      value: theme.palette.warning.main,
      color: "warning.main",
    },
    {
      value: theme.palette.primary.lighter,
      color: "primary.lighter",
    },
    {
      value: theme.palette.error.lighter,
      color: "error.lighter",
    },
    {
      value: theme.palette.success.lighter,
      color: "success.lighter",
    },
    {
      value: theme.palette.secondary.lighter,
      color: "secondary.lighter",
    },
    {
      value: theme.palette.warning.lighter,
      color: "warning.lighter",
    },
  ];

  useEffect(() => {
    if (selectedImage) {
      setAvatar(URL.createObjectURL(selectedImage));
    }
  }, [selectedImage]);

  const EnrolleeSchema = Yup.object().shape({
    firstName: Yup.string().max(255).required("Mandatory feild"),
    lastName: Yup.string().max(255).required("Mandatory feild"),
    group: Yup.string().required("group is required"),
    email: Yup.string()
      .max(255)
      .required("Email is required")
      .email("Must be a valid email"),
    role: Yup.string().required("role is required"),
  });

  const [openAlert, setOpenAlert] = useState(false);

  const handleAlertClose = () => {
    setOpenAlert(!openAlert);
    onCancel();
  };

  const formik = useFormik({
    initialValues: getInitialValues(customer),
    validationSchema: singleParticipant ? EnrolleeSchema : null,
    onSubmit: async (values, { setSubmitting }) => {
      const FirstName =
        values.firstName.charAt(0).toUpperCase() + values.firstName.slice(1);
      const LastName =
        values.lastName.charAt(0).toUpperCase() + values.lastName.slice(1);
      const getChipColor = () => {
        const filteredGroups = groups.filter(
          (group) => group.groupName === values.group
        );
        if (
          filteredGroups.length > 0 &&
          filteredGroups[0].chipColor !== undefined
        ) {
          return filteredGroups[0].chipColor;
        } else return "#d13c31";
      };
      const chipColor = getChipColor();
      try {
        const newParticipants = filteredSelectedEnrollees;
        const newParticipant = {
          participant: {
            id: uuidv4(),
            firstName: FirstName,
            lastName: LastName,
            derpartement: "Active",
            participantStatus: "Active",
            email: values.email,
            sub_organization: 1,
            roleId: toString(1),
            profilePrefs: { key1: "value1" },
            credentials: { username: "bob" },
          },
        };
        if (customer) {
          // dispatch(updateCustomer(customer.id, newCustomer)); - update
          dispatch(
            openSnackbar({
              open: true,
              message: "Customer updated successfully.",
              variant: "alert",
              alert: {
                color: "success",
              },
              close: false,
            })
          );
        } else if (singleParticipant) {
          handleAddParticipant(newParticipant);
          // dispatch(createCustomer(newCustomer)); - add
          dispatch(
            openSnackbar({
              open: true,
              message: error,
              variant: "alert",
              alert: {
                color: "success",
              },
              close: false,
            })
          );
        } else {
          handleAddMany(newParticipants);
        }

        setSubmitting(true);
        onCancel();
      } catch (error) {
        console.error(error);
      }
    },
  });

  const {
    errors,
    touched,
    handleSubmit,
    isSubmitting,
    getFieldProps,
    setFieldValue,
  } = formik;

  return (
    <>
      <FormikProvider value={formik}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
            <MainCard
              title={
                customer
                  ? "Edit Participant"
                  : singleParticipant
                  ? "New Participant"
                  : "New Participants"
              }
              secondary={
                <FormControlLabel
                  control={<Switch onChange={handleAddMultiple} />}
                  label="Add Single Participant"
                />
              }
              content={false}
              sx={{ overflow: "visible" }}
            >
              <Divider />
              <CardContent sx={{ p: 6.5 }}>
                {singleParticipant ? (
                  <Grid container spacing={3}>
                    {/* avatar section */}
                    <Grid item xs={12} md={3}>
                      <Stack
                        direction="row"
                        justifyContent="center"
                        sx={{ mt: 3 }}
                      >
                        <FormLabel
                          htmlFor="change-avtar"
                          sx={{
                            position: "relative",
                            borderRadius: "50%",
                            overflow: "hidden",
                            "&:hover .MuiBox-root": { opacity: 1 },
                            cursor: "pointer",
                          }}
                        >
                          <Avatar
                            alt="Avatar 1"
                            src={avatar}
                            sx={{ width: 72, height: 72, border: "1px dashed" }}
                          />
                          <Box
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              backgroundColor:
                                theme.palette.mode === "dark"
                                  ? "rgba(255, 255, 255, .75)"
                                  : "rgba(0,0,0,.65)",
                              width: "100%",
                              height: "100%",
                              opacity: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Stack spacing={0.5} alignItems="center">
                              <CameraOutlined
                                style={{
                                  color: theme.palette.secondary.lighter,
                                  fontSize: "2rem",
                                }}
                              />
                              <Typography sx={{ color: "secondary.lighter" }}>
                                Upload
                              </Typography>
                            </Stack>
                          </Box>
                        </FormLabel>
                        <TextField
                          type="file"
                          id="change-avtar"
                          placeholder="Outlined"
                          variant="outlined"
                          sx={{ display: "none" }}
                          onChange={(e) =>
                            setSelectedImage(e.target.files?.[0])
                          }
                        />
                      </Stack>
                    </Grid>
                    {/* Form section */}
                    <Grid item xs={12} md={8}>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Stack spacing={1.25}>
                            <InputLabel htmlFor="employee-firstName">
                              First Name
                            </InputLabel>
                            <TextField
                              fullWidth
                              id="employee-firstName"
                              placeholder="Enter Employee First Name"
                              {...getFieldProps("firstName")}
                              error={Boolean(
                                touched.firstName && errors.firstName
                              )}
                              helperText={touched.firstName && errors.firstName}
                            />
                          </Stack>
                        </Grid>
                        <Grid item xs={12}>
                          <Stack spacing={1.25}>
                            <InputLabel htmlFor="employee-lastName">
                              Last Name
                            </InputLabel>
                            <TextField
                              fullWidth
                              id="employee-lastName"
                              placeholder="Enter Employee Last Name"
                              {...getFieldProps("lastName")}
                              error={Boolean(
                                touched.lastName && errors.lastName
                              )}
                              helperText={touched.lastName && errors.lastName}
                            />
                          </Stack>
                        </Grid>
                        <Grid item xs={12}>
                          <Stack spacing={1.25}>
                            <InputLabel htmlFor="employee-email">
                              Email
                            </InputLabel>
                            <TextField
                              fullWidth
                              id="employee-email"
                              placeholder="Enter Employee Email"
                              {...getFieldProps("email")}
                              error={Boolean(touched.email && errors.email)}
                              helperText={touched.email && errors.email}
                            />
                          </Stack>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider />
                        </Grid>
                        <Grid item xs={12}>
                          <Stack spacing={1.25}>
                            <InputLabel htmlFor="employee-role">
                              Role
                            </InputLabel>
                            <Autocomplete
                              fullWidth
                              value={formik.values.role}
                              disableClearable
                              onChange={(event, newValue) => {
                                const jobExist = roles.includes(newValue);
                                if (!jobExist) {
                                  const matchData =
                                    newValue.match(/"((?:\\.|[^"\\])*)"/);
                                  formik.setFieldValue(
                                    "role",
                                    matchData && matchData[1]
                                  );
                                } else {
                                  formik.setFieldValue("role", newValue);
                                }
                              }}
                              filterOptions={(options, params) => {
                                const filtered = filter(options, params);
                                const { inputValue } = params;
                                const isExisting = options.some(
                                  (option) => inputValue === option
                                );
                                if (inputValue !== "" && !isExisting) {
                                  filtered.push(`Add "${inputValue}"`);
                                }
                                return filtered;
                              }}
                              selectOnFocus
                              clearOnBlur
                              autoHighlight
                              handleHomeEndKeys
                              id="free-solo-with-text-demo"
                              options={roles}
                              getOptionLabel={(option) => {
                                let value = option;
                                const jobExist = roles.includes(option);
                                if (!jobExist) {
                                  const matchData =
                                    option.match(/"((?:\\.|[^"\\])*)"/);
                                  if (matchData && matchData[1])
                                    value = matchData && matchData[1];
                                }
                                return value;
                              }}
                              renderOption={(props, option) => {
                                return (
                                  <Box component="li" {...props}>
                                    {option}
                                  </Box>
                                );
                              }}
                              freeSolo
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  name="role"
                                  error={
                                    formik.touched.role &&
                                    Boolean(formik.errors.role)
                                  }
                                  helperText={
                                    formik.touched.role &&
                                    formik.errors.role &&
                                    formik.errors.role
                                  }
                                  placeholder="Select Role"
                                  InputProps={{
                                    ...params.InputProps,
                                  
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <DownOutlined />
                                        {/* <ArrowDropDown sx={{ color: 'text.primary' }} /> */}
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              )}
                            />
                          </Stack>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider />
                        </Grid>
                        <Grid item xs={12}>
                          <Stack spacing={1.25}>
                            {!isNewGroup ? (
                              <>
                                <InputLabel htmlFor="employee-group">
                                  Add to Group
                                </InputLabel>
                                <FormControl fullWidth>
                                  <Select
                                    id="column-hiding"
                                    displayEmpty
                                    {...getFieldProps("group")}
                                    onChange={(event) =>
                                      setFieldValue("group", event.target.value)
                                    }
                                    input={
                                      <OutlinedInput
                                        id="select-column-hiding"
                                        placeholder="Sort by"
                                      />
                                    }
                                    defaultValue="n/a"
                                    // Disable based on checkbox state
                                    disabled={isNewGroup}
                                    renderValue={(selected) => {
                                      if (!selected) {
                                        return (
                                          <Chip
                                            style={{
                                              backgroundColor: "#d13c31",
                                              color: "#fff",
                                            }}
                                            label="Individual"
                                            size="small"
                                            variant="filled"
                                          />
                                        );
                                      }
                                      const chipcolor = groups.filter(
                                        (group) => group.groupName === selected
                                      )[0].chipColor;
                                      return (
                                        <Chip
                                          style={{
                                            backgroundColor: chipcolor,
                                            color: "#fff",
                                          }}
                                          label={selected}
                                          size="small"
                                          variant="filled"
                                        />
                                      );
                                    }}
                                  >
                                    {groups.map((group) => (
                                      <MenuItem
                                        key={group.id}
                                        value={group.groupName}
                                      >
                                        <Chip
                                          style={{
                                            backgroundColor: group.chipColor,
                                            color: "#fff",
                                          }}
                                          label={group.groupName}
                                          size="small"
                                          variant="filled"
                                        />
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                {touched.group && errors.group && (
                                  <FormHelperText
                                    error
                                    id="standard-weight-helper-text-email-login"
                                    sx={{ pl: 1.75 }}
                                  >
                                    {errors.group}
                                  </FormHelperText>
                                )}
                              </>
                            ) : (
                              <>
                                <Grid item xs={12}>
                                  <Stack spacing={1.25}>
                                    <InputLabel htmlFor="employee-group">
                                      New Group
                                    </InputLabel>
                                    <TextField
                                      fullWidth
                                      id="employee-group"
                                      multiline
                                      rows={1}
                                      placeholder="Enter Group name"
                                      {...getFieldProps("group")}
                                      // Disable based on checkbox state
                                      disabled={!isNewGroup}
                                      error={Boolean(
                                        touched.group && errors.group
                                      )}
                                      helperText={touched.group && errors.group}
                                    />
                                  </Stack>
                                </Grid>

                                <Grid item xs={12}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                      <Typography variant="subtitle1">
                                        Background Color
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                      <FormControl>
                                        <RadioGroup
                                          row
                                          aria-label="color"
                                          {...getFieldProps("color")}
                                          onChange={(e) =>
                                            setFieldValue(
                                              "color",
                                              e.target.value
                                            )
                                          }
                                          name="color-radio-buttons-group"
                                          sx={{
                                            "& .MuiFormControlLabel-root": {
                                              mr: 2,
                                            },
                                          }}
                                        >
                                          {backgroundColor.map(
                                            (item, index) => (
                                              <ColorPalette
                                                key={index}
                                                value={item.value}
                                                color={item.color}
                                              />
                                            )
                                          )}
                                        </RadioGroup>
                                      </FormControl>
                                    </Grid>
                                  </Grid>
                                </Grid>
                              </>
                            )}

                            {/* Checkbox for enabling/disabling the input */}
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isNewGroup}
                                  onChange={() => setIsNewGroup(!isNewGroup)}
                                />
                              }
                              label="Create New"
                            />
                          </Stack>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider />
                        </Grid>

                        <Grid item xs={12}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                          >
                            <Stack spacing={0.5}>
                              <Typography variant="subtitle1">
                                Increment starting from the previous group name.
                              </Typography>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                The auto-increment button is like a magic button
                                that makes numbers go up by themselves.
                              </Typography>
                            </Stack>
                            <FormControlLabel
                              control={<Switch defaultChecked sx={{ mt: 0 }} />}
                              label=""
                              labelPlacement="start"
                            />
                          </Stack>
                        </Grid>
                        <Divider sx={{ my: 2 }} />
                      </Grid>
                    </Grid>
                  </Grid>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Stack spacing={1.25}>
                        <InputLabel htmlFor="group-participants">
                          Enroll existing learners
                        </InputLabel>
                        {employees && (
                          <TransferLists
                            learners={employees}
                            enrolled={enrolled}
                            handleSelectedEnrollee={
                              handleSelectedEnrollee
                            }
                          />
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
              <Divider />
              <DialogActions sx={{ p: 2.5 }}>
                <Grid
                  container
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Grid item>
                    {!isCreating && (
                      <Tooltip title="Delete Customer" placement="top">
                        <IconButton
                          onClick={() => setOpenAlert(true)}
                          size="large"
                          color="error"
                        >
                          <DeleteFilled />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Grid>
                  <Grid item>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button color="error" onClick={onCancel}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                      >
                        {customer ? "Edit" : "Add"}
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </DialogActions>
            </MainCard>
          </Form>
        </LocalizationProvider>
      </FormikProvider>
      {!isCreating && (
        <AlertCustomerDelete
          title={customer.fatherName}
          open={openAlert}
          handleClose={handleAlertClose}
        />
      )}
    </>
  );
};

AddParticipantForm.propTypes = {
  customer: PropTypes.any,
  onCancel: PropTypes.func,
};

export default AddParticipantForm;
