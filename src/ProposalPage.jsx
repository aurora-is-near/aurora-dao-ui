import React, {useEffect, useState} from 'react'
import {Contract} from "near-api-js";

import {
  MDBBadge,
  MDBBox,
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCardHeader, MDBCardText, MDBCol,
  MDBContainer, MDBIcon, MDBLink, MDBMask,
  MDBModal,
  MDBModalBody,
  MDBModalFooter,
  MDBModalHeader, MDBPopover, MDBPopoverBody, MDBRow, MDBTooltip, MDBView
} from "mdbreact";
import {useGlobalState} from './utils/container'
import {convertDuration, timestampToReadable, yoktoNear} from './utils/funcs'
import Navbar from "./Navbar";
import Footer from "./Footer";
import {useParams} from "react-router-dom";

export const Proposal = (props) => {
  const [showSpinner, setShowSpinner] = useState(false);
  const stateCtx = useGlobalState();
  const [votedWarning, setVotedWarning] = useState(false);

  const vote = async (vote) => {
    try {
      setShowSpinner(true);
      await window.contract.vote({
        id: props.id,
        vote: vote,
      })
    } catch (e) {
      console.log(e);
      props.setShowError(e);
    } finally {
      setShowSpinner(false);
    }
  }

  const finalize = async () => {
    try {
      setShowSpinner(true);
      await window.contract.finalize({
        id: props.id,
      })
    } catch (e) {
      console.log(e);
      props.setShowError(e);
    } finally {
      setShowSpinner(false);
    }
  }

  const handleVoteYes = () => {
    if (props.data.votes[window.walletConnection.getAccountId()] === undefined) {
      vote('Yes').then().catch((e) => {
        console.log(e);
      });
    } else {
      setVotedWarning(true);
    }
  }

  const handleVoteNo = () => {
    if (props.data.votes[window.walletConnection.getAccountId()] === undefined) {
      vote('No').then().catch((e) => {
        console.log(e);
      });
    } else {
      setVotedWarning(true);
    }
  }

  const handleFinalize = () => {
    finalize().then().catch((e) => {
      console.log(e);
    });
  }

  const toggleVoteWarningOff = () => {
    setVotedWarning(false);
  }

  return (
    <MDBCol className="col-12 col-sm-8 col-lg-6 mx-auto">
      <MDBModal modalStyle="danger" centered size="sm" isOpen={votedWarning} toggle={toggleVoteWarningOff}>
        <MDBModalHeader>Warning!</MDBModalHeader>
        <MDBModalBody className="text-center">
          You are already voted
        </MDBModalBody>
        <MDBModalFooter>
          <MDBBtn className="w-100" color="info" onClick={toggleVoteWarningOff}>Close</MDBBtn>
        </MDBModalFooter>
      </MDBModal>
      <MDBCard className="mb-5">
        <MDBCardHeader className="text-center h4-responsive">
          {props.data.kind.AddMemberToRole !== undefined ? "Add Member To Role: " + props.data.kind.AddMemberToRole.member_id + " Role: " + props.data.kind.AddMemberToRole.role : null}
          {props.data.kind.ChangeConfig !== undefined ? "Change Config: "  : null}
          {props.data.kind.ChangePolicy !== undefined ? "Change Policy: "  : null}
          {props.data.kind.RemoveMemberFromRole !== undefined ? "Remove Member From Role: " : null}
          {props.data.kind.FunctionCall !== undefined ? "Function Call: " : null}
          {props.data.kind.UpgradeSelf !== undefined ? "Upgrade Self: " : null}
          {props.data.kind.UpgradeRemote !== undefined ? "Upgrade Remote: " : null}
          {props.data.kind.Transfer !== undefined ? "Transfer: " : null}
          {props.data.kind.SetStakingContract !== undefined ? "Set Staking Contract" : null}
          {props.data.kind.Vote !== undefined ? "Vote: " : null}
          <div className="clearfix"/>
        </MDBCardHeader>

      </MDBCard>
      {/*<QuestionModal show={showModal} text={modalText} handleVoteYes={handleVoteYes}/>*/}
    </MDBCol>
  )
}

const ProposalPage = () => {
  const [proposals, setProposals] = useState(null);
  const [council, setCouncil] = useState([]);

  let {dao, proposal} = useParams();
  const [showError, setShowError] = useState(null);


  useEffect(
    () => {
      window.contract = new Contract(window.walletConnection.account(), dao, {
        viewMethods: ['get_policy', 'get_proposal', 'get_num_proposals', 'get_proposals'],
        changeMethods: ['add_proposal', 'act_proposal'],
      })
    },
    [dao]
  )

  useEffect(
    () => {
      window.contract.get_policy()
        .then(r => {
          var roles = [];
          data.roles.map((item, _) => {
            if (item.name === 'council') {
              roles =item.kind.Group;
            }
          });
          setCouncil(roles);
        }).catch((e) => {
        console.log(e);
        setShowError(e);
      })
    },
    [dao]
  )


  useEffect(
    () => {
      window.contract.get_proposals({from_index: parseInt(proposal), limit: 1})
        .then(list => {
          console.log(list)
          const t = []
          list.map((item, key) => {
            const t2 = {}
            Object.assign(t2, {key: key}, item);
            t.push(t2);
          })
          setProposals(t);
        })
    },
    [dao, proposal]
  )

  console.log(proposals)

  return (
    <MDBView className="w-100 h-100" style={{minHeight: "100vh"}}>
      <MDBMask className="d-flex justify-content-center grey lighten-2 align-items-center gradient"/>
      <Navbar/>
      <MDBContainer style={{minHeight: "100vh"}} className="mt-5">
        <MDBCol className="col-12 col-sm-8 col-lg-6 mx-auto mb-3">
          <MDBCard>
            <MDBCardBody className="text-left p-4 m-4">
              <MDBBox><b>Proposal DAO:</b> {dao}</MDBBox>
              <MDBBox><b>Council:</b> {council.map((item, key) => (<span>{item}{" "}</span>))}</MDBBox>
              <hr/>
              <MDBLink to={"/" + dao} className="btn-secondary text-center">BACK TO DAO</MDBLink>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>

        {proposals !== null ?
          proposals.map((item, key) => (
            <Proposal data={item} key={parseInt(proposal)} id={parseInt(proposal)} council={council}
                      setShowError={setShowError} dao={dao}/>
          ))
          : null
        }

        {proposals !== null && proposals.length === 0 ?
          <MDBCard className="text-center p-4 m-4">
            <MDBBox>Sorry, nothing was found</MDBBox>
          </MDBCard>
          : null}

      </MDBContainer>
      <Footer/>
    </MDBView>
  );

}

export default ProposalPage;
